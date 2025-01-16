// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Injectable } from "@angular/core";

import { ClientType, DeviceType } from "@bitwarden/common/enums";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

@Injectable()
export class WebPlatformUtilsService implements PlatformUtilsService {
  private browserCache: DeviceType = null;

  constructor(
    private i18nService: I18nService,
    private messagingService: MessagingService,
    private logService: LogService,
  ) {}

  getDevice(): DeviceType {
    if (this.browserCache != null) {
      return this.browserCache;
    }

    if (
      navigator.userAgent.indexOf(" Firefox/") !== -1 ||
      navigator.userAgent.indexOf(" Gecko/") !== -1
    ) {
      this.browserCache = DeviceType.FirefoxBrowser;
    } else if (navigator.userAgent.indexOf(" OPR/") >= 0) {
      this.browserCache = DeviceType.OperaBrowser;
    } else if (navigator.userAgent.indexOf(" Edg/") !== -1) {
      this.browserCache = DeviceType.EdgeBrowser;
    } else if (navigator.userAgent.indexOf(" Vivaldi/") !== -1) {
      this.browserCache = DeviceType.VivaldiBrowser;
    } else if (
      navigator.userAgent.indexOf(" Safari/") !== -1 &&
      navigator.userAgent.indexOf("Chrome") === -1
    ) {
      this.browserCache = DeviceType.SafariBrowser;
    } else if ((window as any).chrome && navigator.userAgent.indexOf(" Chrome/") !== -1) {
      this.browserCache = DeviceType.ChromeBrowser;
    } else if (navigator.userAgent.indexOf(" Trident/") !== -1) {
      this.browserCache = DeviceType.IEBrowser;
    } else {
      this.browserCache = DeviceType.UnknownBrowser;
    }

    return this.browserCache;
  }

  getDeviceString(): string {
    const device = DeviceType[this.getDevice()].toLowerCase();
    return device.replace("browser", "");
  }

  getClientType() {
    return ClientType.Web;
  }

  isFirefox(): boolean {
    return this.getDevice() === DeviceType.FirefoxBrowser;
  }

  isChrome(): boolean {
    return this.getDevice() === DeviceType.ChromeBrowser;
  }

  isEdge(): boolean {
    return this.getDevice() === DeviceType.EdgeBrowser;
  }

  isOpera(): boolean {
    return this.getDevice() === DeviceType.OperaBrowser;
  }

  isVivaldi(): boolean {
    return this.getDevice() === DeviceType.VivaldiBrowser;
  }

  isSafari(): boolean {
    return this.getDevice() === DeviceType.SafariBrowser;
  }

  isMacAppStore(): boolean {
    return false;
  }

  isViewOpen(): Promise<boolean> {
    return Promise.resolve(false);
  }

  launchUri(uri: string, options?: any): void {
    const a = document.createElement("a");
    a.href = uri;
    if (options == null || !options.sameWindow) {
      a.target = "_blank";
      a.rel = "noreferrer noopener";
    }
    a.classList.add("d-none");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getApplicationVersion(): Promise<string> {
    return Promise.resolve(process.env.APPLICATION_VERSION || "-");
  }

  async getApplicationVersionNumber(): Promise<string> {
    return (await this.getApplicationVersion()).split(RegExp("[+|-]"))[0].trim();
  }

  supportsWebAuthn(win: Window): boolean {
    return typeof PublicKeyCredential !== "undefined";
  }

  supportsDuo(): boolean {
    return true;
  }

  showToast(
    type: "error" | "success" | "warning" | "info",
    title: string,
    text: string | string[],
    options?: any,
  ): void {
    this.messagingService.send("showToast", {
      text: text,
      title: title,
      type: type,
      options: options,
    });
  }

  isDev(): boolean {
    return process.env.NODE_ENV === "development";
  }

  isSelfHost(): boolean {
    return WebPlatformUtilsService.isSelfHost();
  }

  static isSelfHost(): boolean {
    return process.env.ENV.toString() === "selfhosted";
  }

  supportsSecureStorage() {
    return false;
  }

  getAutofillKeyboardShortcut(): Promise<string> {
    return null;
  }
}
