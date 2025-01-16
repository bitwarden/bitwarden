// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Directive, OnInit } from "@angular/core";

import { ClipboardService } from "@bitwarden/common/platform/abstractions/clipboard.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ToastService } from "@bitwarden/components";
import { GeneratedPasswordHistory } from "@bitwarden/generator-history";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/generator-legacy";

@Directive()
export class PasswordGeneratorHistoryComponent implements OnInit {
  history: GeneratedPasswordHistory[] = [];

  constructor(
    protected passwordGenerationService: PasswordGenerationServiceAbstraction,
    private clipboardService: ClipboardService,
    protected i18nService: I18nService,
    private win: Window,
    protected toastService: ToastService,
  ) {}

  async ngOnInit() {
    this.history = await this.passwordGenerationService.getHistory();
  }

  clear = async () => {
    this.history = await this.passwordGenerationService.clear();
  };

  copy(password: string) {
    const copyOptions = this.win != null ? { window: this.win } : null;
    this.clipboardService.copyToClipboard(password, copyOptions);
    this.toastService.showToast({
      variant: "info",
      title: null,
      message: this.i18nService.t("valueCopied", this.i18nService.t("password")),
    });
  }
}
