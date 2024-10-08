import {
  combineLatest,
  concatMap,
  firstValueFrom,
  Observable,
  shareReplay,
  map,
  filter,
} from "rxjs";

import {
  BitwardenClient,
  ClientSettings,
  LogLevel,
  DeviceType as SdkDeviceType,
} from "@bitwarden/sdk-internal";

import { ApiService } from "../../../abstractions/api.service";
import { AccountService } from "../../../auth/abstractions/account.service";
import { KdfConfigService } from "../../../auth/abstractions/kdf-config.service";
import { DeviceType } from "../../../enums/device-type.enum";
import { UserId } from "../../../types/guid";
import { CryptoService } from "../../abstractions/crypto.service";
import { Environment, EnvironmentService } from "../../abstractions/environment.service";
import { PlatformUtilsService } from "../../abstractions/platform-utils.service";
import { SdkClientFactory } from "../../abstractions/sdk/sdk-client-factory";
import { SdkService } from "../../abstractions/sdk/sdk.service";
import { KdfType } from "../../enums";

export class DefaultSdkService implements SdkService {
  private sdkClientCache = new Map<UserId, Observable<BitwardenClient>>();

  client$ = this.environmentService.environment$.pipe(
    concatMap(async (env) => {
      const settings = this.toSettings(env);
      return await this.sdkClientFactory.createSdkClient(settings, LogLevel.Info);
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  supported$ = this.client$.pipe(
    concatMap(async (client) => {
      return client.echo("bitwarden wasm!") === "bitwarden wasm!";
    }),
  );

  constructor(
    private sdkClientFactory: SdkClientFactory,
    private environmentService: EnvironmentService,
    private platformUtilsService: PlatformUtilsService,
    private accountService: AccountService,
    private kdfConfigService: KdfConfigService,
    private cryptoService: CryptoService,
    private apiService: ApiService, // Yes we shouldn't import ApiService, but it's temporary
    private userAgent: string = null,
  ) {}

  userClient$(userId: UserId): Observable<BitwardenClient> {
    // TODO: Figure out what happens when the user logs out
    if (this.sdkClientCache.has(userId)) {
      return this.sdkClientCache.get(userId);
    }

    const account$ = this.accountService.accounts$.pipe(map((accounts) => accounts[userId]));
    const kdfParams$ = this.kdfConfigService.getKdfConfig$(userId);
    const privateKey$ = this.cryptoService
      .userEncryptedPrivateKey$(userId)
      .pipe(filter((key) => key != null));
    const userKey$ = this.cryptoService.userKey$(userId).pipe(filter((key) => key != null));

    const client$ = combineLatest([
      this.environmentService.environment$,
      account$,
      kdfParams$,
      privateKey$,
      userKey$,
    ]).pipe(
      concatMap(async ([env, account, kdfParams, privateKey, userKey]) => {
        const settings = this.toSettings(env);
        const client = await this.sdkClientFactory.createSdkClient(settings, LogLevel.Info);

        await client.crypto().initialize_user_crypto({
          email: account.email,
          method: { decryptedKey: { decrypted_user_key: userKey.keyB64 } },
          kdfParams:
            kdfParams.kdfType === KdfType.PBKDF2_SHA256
              ? {
                  pBKDF2: { iterations: kdfParams.iterations },
                }
              : {
                  argon2id: {
                    iterations: kdfParams.iterations,
                    memory: kdfParams.memory,
                    parallelism: kdfParams.parallelism,
                  },
                },
          privateKey,
        });

        return client;
      }),
    );

    this.sdkClientCache.set(userId, client$);
    return client$;
  }

  async failedToInitialize(): Promise<void> {
    // Only log on cloud instances
    if (
      this.platformUtilsService.isDev() ||
      !(await firstValueFrom(this.environmentService.environment$)).isCloud
    ) {
      return;
    }

    return this.apiService.send("POST", "/wasm-debug", null, false, false, null, (headers) => {
      headers.append("SDK-Version", "1.0.0");
    });
  }

  private toSettings(env: Environment): ClientSettings {
    return {
      apiUrl: env.getApiUrl(),
      identityUrl: env.getIdentityUrl(),
      deviceType: this.toDevice(this.platformUtilsService.getDevice()),
      userAgent: this.userAgent ?? navigator.userAgent,
    };
  }

  private toDevice(device: DeviceType): SdkDeviceType {
    switch (device) {
      case DeviceType.Android:
        return "Android";
      case DeviceType.iOS:
        return "iOS";
      case DeviceType.ChromeExtension:
        return "ChromeExtension";
      case DeviceType.FirefoxExtension:
        return "FirefoxExtension";
      case DeviceType.OperaExtension:
        return "OperaExtension";
      case DeviceType.EdgeExtension:
        return "EdgeExtension";
      case DeviceType.WindowsDesktop:
        return "WindowsDesktop";
      case DeviceType.MacOsDesktop:
        return "MacOsDesktop";
      case DeviceType.LinuxDesktop:
        return "LinuxDesktop";
      case DeviceType.ChromeBrowser:
        return "ChromeBrowser";
      case DeviceType.FirefoxBrowser:
        return "FirefoxBrowser";
      case DeviceType.OperaBrowser:
        return "OperaBrowser";
      case DeviceType.EdgeBrowser:
        return "EdgeBrowser";
      case DeviceType.IEBrowser:
        return "IEBrowser";
      case DeviceType.UnknownBrowser:
        return "UnknownBrowser";
      case DeviceType.AndroidAmazon:
        return "AndroidAmazon";
      case DeviceType.UWP:
        return "UWP";
      case DeviceType.SafariBrowser:
        return "SafariBrowser";
      case DeviceType.VivaldiBrowser:
        return "VivaldiBrowser";
      case DeviceType.VivaldiExtension:
        return "VivaldiExtension";
      case DeviceType.SafariExtension:
        return "SafariExtension";
      case DeviceType.Server:
        return "Server";
      case DeviceType.WindowsCLI:
        return "WindowsCLI";
      case DeviceType.MacOsCLI:
        return "MacOsCLI";
      case DeviceType.LinuxCLI:
        return "LinuxCLI";
      default:
        return "SDK";
    }
  }
}
