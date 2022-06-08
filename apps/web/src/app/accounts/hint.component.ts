import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { HintComponent as BaseHintComponent } from "@bitwarden/angular/src/components/hint.component";
import { ApiService } from "@bitwarden/common/src/abstractions/api.service";
import { I18nService } from "@bitwarden/common/src/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/src/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";

@Component({
  selector: "app-hint",
  templateUrl: "hint.component.html",
})
export class HintComponent extends BaseHintComponent {
  constructor(
    router: Router,
    i18nService: I18nService,
    apiService: ApiService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService
  ) {
    super(router, i18nService, apiService, platformUtilsService, logService);
  }
}
