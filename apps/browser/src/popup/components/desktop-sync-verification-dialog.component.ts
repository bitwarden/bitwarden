import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { filter, Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { MessageListener } from "@bitwarden/common/platform/messaging";
import { ButtonModule, DialogModule, DialogService } from "@bitwarden/components";

export type DesktopSyncVerificationDialogParams = {
  fingerprint: string[];
};

@Component({
  templateUrl: "desktop-sync-verification-dialog.component.html",
  standalone: true,
  imports: [JslibModule, ButtonModule, DialogModule],
})
export class DesktopSyncVerificationDialogComponent implements OnDestroy, OnInit {
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(DIALOG_DATA) protected params: DesktopSyncVerificationDialogParams,
    private dialogRef: DialogRef<DesktopSyncVerificationDialogComponent>,
    private messageListener: MessageListener,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.messageListener.allMessages$
      .pipe(
        filter((m) => m.command === "hideNativeMessagingFinterprintDialog"),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.dialogRef.close();
      });
  }

  static open(dialogService: DialogService, data: DesktopSyncVerificationDialogParams) {
    return dialogService.open(DesktopSyncVerificationDialogComponent, {
      data,
    });
  }
}
