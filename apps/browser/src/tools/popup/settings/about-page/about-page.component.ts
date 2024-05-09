import { Component } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { DeviceType } from "@bitwarden/common/enums";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";

import { BrowserApi } from "../../../../platform/browser/browser-api";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";

const RateUrls = {
  [DeviceType.ChromeExtension]:
    "https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews",
  [DeviceType.FirefoxExtension]:
    "https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/#reviews",
  [DeviceType.OperaExtension]:
    "https://addons.opera.com/en/extensions/details/bitwarden-free-password-manager/#feedback-container",
  [DeviceType.EdgeExtension]:
    "https://microsoftedge.microsoft.com/addons/detail/jbkfoedolllekgbhcbcoahefnbanhhlh",
  [DeviceType.VivaldiExtension]:
    "https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews",
  [DeviceType.SafariExtension]: "https://apps.apple.com/app/bitwarden/id1352778147",
};

@Component({
  selector: "app-about-page",
  templateUrl: "about-page.component.html",
})
export class AboutPageComponent {
  constructor(
    private dialogService: DialogService,
    private environmentService: EnvironmentService,
    private platformUtilsService: PlatformUtilsService,
  ) {}

  about() {
    this.dialogService.open(AboutDialogComponent);
  }

  async launchHelp() {
    await BrowserApi.createNewTab("https://bitwarden.com/help/");
  }

  async openWebVault() {
    const env = await firstValueFrom(this.environmentService.environment$);
    const url = env.getWebVaultUrl();
    await BrowserApi.createNewTab(url);
  }

  async launchContactForm() {
    await BrowserApi.createNewTab("https://bitwarden.com/contact/");
  }

  async launchForums() {
    await BrowserApi.createNewTab("https://bitwarden.com/getinvolved/");
  }

  async rate() {
    const deviceType = this.platformUtilsService.getDevice();
    await BrowserApi.createNewTab((RateUrls as any)[deviceType]);
  }
}
