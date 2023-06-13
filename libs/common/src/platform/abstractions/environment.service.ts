import { Observable } from "rxjs";

export type Urls = {
  base?: string;
  webVault?: string;
  api?: string;
  identity?: string;
  icons?: string;
  notifications?: string;
  events?: string;
  keyConnector?: string;
  scim?: string;
};

export type PayPalConfig = {
  businessId?: string;
  buttonAction?: string;
};

export abstract class EnvironmentService {
  urls: Observable<Urls>;
  usUrls: Urls;
  euUrls: Urls;

  hasBaseUrl: () => boolean;
  getNotificationsUrl: () => string;
  getWebVaultUrl: () => string;
  getSendUrl: () => string;
  getIconsUrl: () => string;
  getApiUrl: () => string;
  getIdentityUrl: () => string;
  getEventsUrl: () => string;
  getKeyConnectorUrl: () => string;
  getScimUrl: () => string;
  setUrlsFromStorage: () => Promise<void>;
  setUrls: (urls: Urls) => Promise<Urls>;
  getUrls: () => Urls;
  isCloud: () => boolean;
  compareCurrentWithUrls: (urls: Urls) => boolean;
  isEmpty: () => boolean;
  /**
   * @remarks For desktop and browser use only.
   * For web, use PlatformUtilsService.isSelfHost()
   */
  isSelfHosted: () => boolean;
}
