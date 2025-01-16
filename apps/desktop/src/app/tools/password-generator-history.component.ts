import { Component } from "@angular/core";

import { PasswordGeneratorHistoryComponent as BasePasswordGeneratorHistoryComponent } from "@bitwarden/angular/tools/generator/components/password-generator-history.component";
import { ClipboardService } from "@bitwarden/common/platform/abstractions/clipboard.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ToastService } from "@bitwarden/components";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/generator-legacy";

@Component({
  selector: "app-password-generator-history",
  templateUrl: "password-generator-history.component.html",
})
export class PasswordGeneratorHistoryComponent extends BasePasswordGeneratorHistoryComponent {
  constructor(
    passwordGenerationService: PasswordGenerationServiceAbstraction,
    clipboardService: ClipboardService,
    i18nService: I18nService,
    toastService: ToastService,
  ) {
    super(passwordGenerationService, clipboardService, i18nService, window, toastService);
  }
}
