import { Router } from "@angular/router";
import { firstValueFrom, ReplaySubject } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import {
  Environment,
  Region,
  RegionConfig,
  Urls,
} from "@bitwarden/common/platform/abstractions/environment.service";
import {
  CloudEnvironment,
  DefaultEnvironmentService,
  SelfHostedEnvironment,
} from "@bitwarden/common/platform/services/default-environment.service";
import { StateProvider } from "@bitwarden/common/platform/state";

/**
 * Web specific environment service. Ensures that the urls are set from the window location.
 */
export class WebEnvironmentService extends DefaultEnvironmentService {
  constructor(
    private win: Window,
    stateProvider: StateProvider,
    accountService: AccountService,
    additionalRegionConfigs: RegionConfig[] = [],
    private router: Router,
    private envUrls: Urls,
  ) {
    super(stateProvider, accountService, additionalRegionConfigs);

    // The web vault always uses the current location as the base url
    envUrls.base ??= this.win.location.origin;

    // Find the region
    const currentHostname = new URL(this.win.location.href).hostname;
    const availableRegions = this.availableRegions();
    const region = availableRegions.find((r) => {
      // We must use hostname as our QA envs use the same
      // domain (bitwarden.pw) but different subdomains (qa and euqa)
      const webVaultHostname = new URL(r.urls.webVault).hostname;
      return webVaultHostname === currentHostname;
    });

    let environment: Environment;
    if (region) {
      environment = new WebCloudEnvironment(region, envUrls);
    } else {
      environment = new SelfHostedEnvironment(envUrls);
    }

    // Override the environment observable with a replay subject
    const subject = new ReplaySubject<Environment>(1);
    subject.next(environment);
    this.environment$ = subject.asObservable();
  }

  // Web setting env means navigating to a new location
  async setEnvironment(region: Region, urls?: Urls): Promise<Urls> {
    if (region === Region.SelfHosted) {
      throw new Error("setEnvironment does not work in web for self-hosted.");
    }

    // Find the region
    const currentHostname = new URL(this.win.location.href).hostname;
    const availableRegions = this.availableRegions();
    const currentRegionConfig = availableRegions.find((r) => {
      // We must use hostname as our QA envs use the same
      // domain (bitwarden.pw) but different subdomains (qa and euqa)
      const webVaultHostname = new URL(r.urls.webVault).hostname;
      return webVaultHostname === currentHostname;
    });

    if (currentRegionConfig.key === region) {
      // They have selected the current region, return the current env urls
      // We can't return the region urls because the env base url is modified
      // in the constructor to match the current window.location.origin.
      const currentEnv = await firstValueFrom(this.environment$);
      return Promise.resolve(currentEnv.getUrls());
    }

    const chosenRegionConfig = this.availableRegions().find((r) => r.key === region);

    if (chosenRegionConfig == null) {
      throw new Error("The selected region is not known as an available region.");
    }

    // Preserve the current in app route + params in the new location
    const routeAndParams = `/#${this.router.url}`;
    this.win.location.href = chosenRegionConfig.urls.webVault + routeAndParams;

    // This return shouldn't matter as we are about to leave the current window
    return Promise.resolve(chosenRegionConfig.urls);
  }
}

export class WebCloudEnvironment extends CloudEnvironment {
  constructor(config: RegionConfig, urls: Urls) {
    super(config);
    // We override the urls to avoid CORS issues
    this.urls = urls;
  }
}
