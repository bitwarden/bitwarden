// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";

import { ClipboardService } from "@bitwarden/common/platform/abstractions/clipboard.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ToastService } from "@bitwarden/components";

export interface AccessTokenDetails {
  subTitle: string;
  expirationDate?: Date;
  accessToken: string;
}

@Component({
  templateUrl: "./access-token-dialog.component.html",
})
export class AccessTokenDialogComponent implements OnInit {
  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: AccessTokenDetails,
    private clipboardService: ClipboardService,
    private toastService: ToastService,
    private i18nService: I18nService,
  ) {}

  ngOnInit(): void {
    // TODO remove null checks once strictNullChecks in TypeScript is turned on.
    if (!this.data.subTitle || !this.data.accessToken) {
      this.dialogRef.close();
      throw new Error("The access token dialog was not called with the appropriate values.");
    }
  }

  copyAccessToken(): void {
    this.clipboardService.copyToClipboard(this.data.accessToken);
    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("accessTokenCreatedAndCopied"),
    });
    this.dialogRef.close();
  }
}
