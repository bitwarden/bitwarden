import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { TwoFactorOptionsComponent as BaseTwoFactorOptionsComponent } from "@bitwarden/angular/src/components/two-factor-options.component";
import { I18nService } from "@bitwarden/common/src/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";
import { TwoFactorService } from "@bitwarden/common/src/abstractions/twoFactor.service";

@Component({
  selector: "app-two-factor-options",
  templateUrl: "two-factor-options.component.html",
})
export class TwoFactorOptionsComponent extends BaseTwoFactorOptionsComponent {
  constructor(
    twoFactorService: TwoFactorService,
    router: Router,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService
  ) {
    super(twoFactorService, router, i18nService, platformUtilsService, window);
  }
}
