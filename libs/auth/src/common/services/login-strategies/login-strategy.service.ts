import {
  combineLatestWith,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  shareReplay,
  Subscription,
} from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { KdfConfigService } from "@bitwarden/common/auth/abstractions/kdf-config.service";
import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/auth/abstractions/master-password.service.abstraction";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { AuthenticationType } from "@bitwarden/common/auth/enums/authentication-type";
import { AuthResult } from "@bitwarden/common/auth/models/domain/auth-result";
import {
  Argon2KdfConfig,
  KdfConfig,
  PBKDF2KdfConfig,
} from "@bitwarden/common/auth/models/domain/kdf-config";
import { TokenTwoFactorRequest } from "@bitwarden/common/auth/models/request/identity-token/token-two-factor.request";
import { PasswordlessAuthRequest } from "@bitwarden/common/auth/models/request/passwordless-auth.request";
import { AuthRequestResponse } from "@bitwarden/common/auth/models/response/auth-request.response";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { PreloginRequest } from "@bitwarden/common/models/request/prelogin.request";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { TaskSchedulerService } from "@bitwarden/common/platform/abstractions/task-scheduler.service";
import { KdfType } from "@bitwarden/common/platform/enums/kdf-type.enum";
import { ScheduledTaskNames } from "@bitwarden/common/platform/enums/scheduled-task-name.enum";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { GlobalState, GlobalStateProvider } from "@bitwarden/common/platform/state";
import { DeviceTrustServiceAbstraction } from "@bitwarden/common/src/auth/abstractions/device-trust.service.abstraction";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { MasterKey } from "@bitwarden/common/types/key";

import { AuthRequestServiceAbstraction, LoginStrategyServiceAbstraction } from "../../abstractions";
import { InternalUserDecryptionOptionsServiceAbstraction } from "../../abstractions/user-decryption-options.service.abstraction";
import { AuthRequestLoginStrategy } from "../../login-strategies/auth-request-login.strategy";
import { PasswordLoginStrategy } from "../../login-strategies/password-login.strategy";
import { SsoLoginStrategy } from "../../login-strategies/sso-login.strategy";
import { UserApiLoginStrategy } from "../../login-strategies/user-api-login.strategy";
import { WebAuthnLoginStrategy } from "../../login-strategies/webauthn-login.strategy";
import {
  UserApiLoginCredentials,
  PasswordLoginCredentials,
  SsoLoginCredentials,
  AuthRequestLoginCredentials,
  WebAuthnLoginCredentials,
} from "../../models";

import {
  AUTH_REQUEST_PUSH_NOTIFICATION_KEY,
  CURRENT_LOGIN_STRATEGY_KEY,
  CacheData,
  CACHE_EXPIRATION_KEY,
  CACHE_KEY,
} from "./login-strategy.state";

const sessionTimeoutLength = 2 * 60 * 1000; // 2 minutes

export class LoginStrategyService implements LoginStrategyServiceAbstraction {
  private sessionTimeoutSubscription: Subscription;
  private currentAuthnTypeState: GlobalState<AuthenticationType | null>;
  private loginStrategyCacheState: GlobalState<CacheData | null>;
  private loginStrategyCacheExpirationState: GlobalState<Date | null>;
  private authRequestPushNotificationState: GlobalState<string>;

  private loginStrategy$: Observable<
    | UserApiLoginStrategy
    | PasswordLoginStrategy
    | SsoLoginStrategy
    | AuthRequestLoginStrategy
    | WebAuthnLoginStrategy
    | null
  >;

  currentAuthType$: Observable<AuthenticationType | null>;

  constructor(
    protected accountService: AccountService,
    protected masterPasswordService: InternalMasterPasswordServiceAbstraction,
    protected cryptoService: CryptoService,
    protected apiService: ApiService,
    protected tokenService: TokenService,
    protected appIdService: AppIdService,
    protected platformUtilsService: PlatformUtilsService,
    protected messagingService: MessagingService,
    protected logService: LogService,
    protected keyConnectorService: KeyConnectorService,
    protected environmentService: EnvironmentService,
    protected stateService: StateService,
    protected twoFactorService: TwoFactorService,
    protected i18nService: I18nService,
    protected encryptService: EncryptService,
    protected passwordStrengthService: PasswordStrengthServiceAbstraction,
    protected policyService: PolicyService,
    protected deviceTrustService: DeviceTrustServiceAbstraction,
    protected authRequestService: AuthRequestServiceAbstraction,
    protected userDecryptionOptionsService: InternalUserDecryptionOptionsServiceAbstraction,
    protected stateProvider: GlobalStateProvider,
    protected billingAccountProfileStateService: BillingAccountProfileStateService,
    protected kdfConfigService: KdfConfigService,
    protected taskSchedulerService: TaskSchedulerService,
  ) {
    this.currentAuthnTypeState = this.stateProvider.get(CURRENT_LOGIN_STRATEGY_KEY);
    this.loginStrategyCacheState = this.stateProvider.get(CACHE_KEY);
    this.loginStrategyCacheExpirationState = this.stateProvider.get(CACHE_EXPIRATION_KEY);
    this.authRequestPushNotificationState = this.stateProvider.get(
      AUTH_REQUEST_PUSH_NOTIFICATION_KEY,
    );
    this.taskSchedulerService.registerTaskHandler(
      ScheduledTaskNames.loginStrategySessionTimeout,
      () => this.clearCache(),
    );

    this.currentAuthType$ = this.currentAuthnTypeState.state$;
    this.loginStrategy$ = this.currentAuthnTypeState.state$.pipe(
      distinctUntilChanged(),
      combineLatestWith(this.loginStrategyCacheState.state$),
      this.initializeLoginStrategy.bind(this),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  async getEmail(): Promise<string | null> {
    const strategy = await firstValueFrom(this.loginStrategy$);

    if ("email$" in strategy) {
      return await firstValueFrom(strategy.email$);
    }
    return null;
  }

  async getMasterPasswordHash(): Promise<string | null> {
    const strategy = await firstValueFrom(this.loginStrategy$);

    if ("serverMasterKeyHash$" in strategy) {
      return await firstValueFrom(strategy.serverMasterKeyHash$);
    }
    return null;
  }

  async getSsoEmail2FaSessionToken(): Promise<string | null> {
    const strategy = await firstValueFrom(this.loginStrategy$);

    if ("ssoEmail2FaSessionToken$" in strategy) {
      return await firstValueFrom(strategy.ssoEmail2FaSessionToken$);
    }
    return null;
  }

  async getAccessCode(): Promise<string | null> {
    const strategy = await firstValueFrom(this.loginStrategy$);

    if ("accessCode$" in strategy) {
      return await firstValueFrom(strategy.accessCode$);
    }
    return null;
  }

  async getAuthRequestId(): Promise<string | null> {
    const strategy = await firstValueFrom(this.loginStrategy$);

    if ("authRequestId$" in strategy) {
      return await firstValueFrom(strategy.authRequestId$);
    }
    return null;
  }

  async logIn(
    credentials:
      | UserApiLoginCredentials
      | PasswordLoginCredentials
      | SsoLoginCredentials
      | AuthRequestLoginCredentials
      | WebAuthnLoginCredentials,
  ): Promise<AuthResult> {
    await this.clearCache();

    await this.currentAuthnTypeState.update((_) => credentials.type);

    const strategy = await firstValueFrom(this.loginStrategy$);

    // Note: We aren't passing the credentials directly to the strategy since they are
    // created in the popup and can cause DeadObject references on Firefox.
    // This is a shallow copy, but use deep copy in future if objects are added to credentials
    // that were created in popup.
    // If the popup uses its own instance of this service, this can be removed.
    const ownedCredentials = { ...credentials };

    const result = await strategy.logIn(ownedCredentials as any);

    if (result != null && !result.requiresTwoFactor) {
      await this.clearCache();
    } else {
      // Cache the strategy data so we can attempt again later with 2fa. Cache supports different contexts
      await this.loginStrategyCacheState.update((_) => strategy.exportCache());
      await this.startSessionTimeout();
    }

    return result;
  }

  async logInTwoFactor(
    twoFactor: TokenTwoFactorRequest,
    captchaResponse: string,
  ): Promise<AuthResult> {
    if (!(await this.isSessionValid())) {
      throw new Error(this.i18nService.t("sessionTimeout"));
    }

    const strategy = await firstValueFrom(this.loginStrategy$);
    if (strategy == null) {
      throw new Error("No login strategy found.");
    }

    try {
      const result = await strategy.logInTwoFactor(twoFactor, captchaResponse);

      // Only clear cache if 2FA token has been accepted, otherwise we need to be able to try again
      if (result != null && !result.requiresTwoFactor && !result.requiresCaptcha) {
        await this.clearCache();
      }
      return result;
    } catch (e) {
      // API exceptions are okay, but if there are any unhandled client-side errors then clear cache to be safe
      if (!(e instanceof ErrorResponse)) {
        await this.clearCache();
      }
      throw e;
    }
  }

  async makePreloginKey(masterPassword: string, email: string): Promise<MasterKey> {
    email = email.trim().toLowerCase();
    let kdfConfig: KdfConfig = null;
    try {
      const preloginResponse = await this.apiService.postPrelogin(new PreloginRequest(email));
      if (preloginResponse != null) {
        kdfConfig =
          preloginResponse.kdf === KdfType.PBKDF2_SHA256
            ? new PBKDF2KdfConfig(preloginResponse.kdfIterations)
            : new Argon2KdfConfig(
                preloginResponse.kdfIterations,
                preloginResponse.kdfMemory,
                preloginResponse.kdfParallelism,
              );
      }
    } catch (e) {
      if (e == null || e.statusCode !== 404) {
        throw e;
      }
    }
    return await this.cryptoService.makeMasterKey(masterPassword, email, kdfConfig);
  }

  // TODO: move to auth request service
  async passwordlessLogin(
    id: string,
    key: string,
    requestApproved: boolean,
  ): Promise<AuthRequestResponse> {
    const pubKey = Utils.fromB64ToArray(key);

    const userId = (await firstValueFrom(this.accountService.activeAccount$)).id;
    const masterKey = await firstValueFrom(this.masterPasswordService.masterKey$(userId));
    let keyToEncrypt;
    let encryptedMasterKeyHash = null;

    if (masterKey) {
      keyToEncrypt = masterKey.encKey;

      // Only encrypt the master password hash if masterKey exists as
      // we won't have a masterKeyHash without a masterKey
      const masterKeyHash = await firstValueFrom(this.masterPasswordService.masterKeyHash$(userId));
      if (masterKeyHash != null) {
        encryptedMasterKeyHash = await this.cryptoService.rsaEncrypt(
          Utils.fromUtf8ToArray(masterKeyHash),
          pubKey,
        );
      }
    } else {
      const userKey = await this.cryptoService.getUserKey();
      keyToEncrypt = userKey.key;
    }

    const encryptedKey = await this.cryptoService.rsaEncrypt(keyToEncrypt, pubKey);

    const request = new PasswordlessAuthRequest(
      encryptedKey.encryptedString,
      encryptedMasterKeyHash?.encryptedString,
      await this.appIdService.getAppId(),
      requestApproved,
    );
    return await this.apiService.putAuthRequest(id, request);
  }

  private async clearCache(): Promise<void> {
    await this.currentAuthnTypeState.update((_) => null);
    await this.loginStrategyCacheState.update((_) => null);
    await this.clearSessionTimeout();
  }

  private async startSessionTimeout(): Promise<void> {
    await this.clearSessionTimeout();
    await this.loginStrategyCacheExpirationState.update(
      (_) => new Date(Date.now() + sessionTimeoutLength),
    );
    this.sessionTimeoutSubscription = this.taskSchedulerService.setTimeout(
      ScheduledTaskNames.loginStrategySessionTimeout,
      sessionTimeoutLength,
    );
  }

  private async clearSessionTimeout(): Promise<void> {
    await this.loginStrategyCacheExpirationState.update((_) => null);
    this.sessionTimeoutSubscription?.unsubscribe();
  }

  private async isSessionValid(): Promise<boolean> {
    const cache = await firstValueFrom(this.loginStrategyCacheState.state$);
    if (cache == null) {
      return false;
    }
    const expiration = await firstValueFrom(this.loginStrategyCacheExpirationState.state$);
    if (expiration != null && expiration < new Date()) {
      await this.clearCache();
      return false;
    }
    return true;
  }

  private initializeLoginStrategy(
    source: Observable<[AuthenticationType | null, CacheData | null]>,
  ) {
    return source.pipe(
      map(([strategy, data]) => {
        if (strategy == null) {
          return null;
        }
        switch (strategy) {
          case AuthenticationType.Password:
            return new PasswordLoginStrategy(
              data?.password,
              this.accountService,
              this.masterPasswordService,
              this.cryptoService,
              this.apiService,
              this.tokenService,
              this.appIdService,
              this.platformUtilsService,
              this.messagingService,
              this.logService,
              this.stateService,
              this.twoFactorService,
              this.userDecryptionOptionsService,
              this.passwordStrengthService,
              this.policyService,
              this,
              this.billingAccountProfileStateService,
              this.kdfConfigService,
            );
          case AuthenticationType.Sso:
            return new SsoLoginStrategy(
              data?.sso,
              this.accountService,
              this.masterPasswordService,
              this.cryptoService,
              this.apiService,
              this.tokenService,
              this.appIdService,
              this.platformUtilsService,
              this.messagingService,
              this.logService,
              this.stateService,
              this.twoFactorService,
              this.userDecryptionOptionsService,
              this.keyConnectorService,
              this.deviceTrustService,
              this.authRequestService,
              this.i18nService,
              this.billingAccountProfileStateService,
              this.kdfConfigService,
            );
          case AuthenticationType.UserApiKey:
            return new UserApiLoginStrategy(
              data?.userApiKey,
              this.accountService,
              this.masterPasswordService,
              this.cryptoService,
              this.apiService,
              this.tokenService,
              this.appIdService,
              this.platformUtilsService,
              this.messagingService,
              this.logService,
              this.stateService,
              this.twoFactorService,
              this.userDecryptionOptionsService,
              this.environmentService,
              this.keyConnectorService,
              this.billingAccountProfileStateService,
              this.kdfConfigService,
            );
          case AuthenticationType.AuthRequest:
            return new AuthRequestLoginStrategy(
              data?.authRequest,
              this.accountService,
              this.masterPasswordService,
              this.cryptoService,
              this.apiService,
              this.tokenService,
              this.appIdService,
              this.platformUtilsService,
              this.messagingService,
              this.logService,
              this.stateService,
              this.twoFactorService,
              this.userDecryptionOptionsService,
              this.deviceTrustService,
              this.billingAccountProfileStateService,
              this.kdfConfigService,
            );
          case AuthenticationType.WebAuthn:
            return new WebAuthnLoginStrategy(
              data?.webAuthn,
              this.accountService,
              this.masterPasswordService,
              this.cryptoService,
              this.apiService,
              this.tokenService,
              this.appIdService,
              this.platformUtilsService,
              this.messagingService,
              this.logService,
              this.stateService,
              this.twoFactorService,
              this.userDecryptionOptionsService,
              this.billingAccountProfileStateService,
              this.kdfConfigService,
            );
        }
      }),
    );
  }
}
