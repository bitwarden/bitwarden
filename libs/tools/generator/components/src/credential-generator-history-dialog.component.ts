// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, distinctUntilChanged, firstValueFrom, map, switchMap } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { UserId } from "@bitwarden/common/types/guid";
import { ButtonModule, DialogModule, DialogService } from "@bitwarden/components";
import { GeneratorHistoryService } from "@bitwarden/generator-history";

import { CredentialGeneratorHistoryComponent as CredentialGeneratorHistoryToolsComponent } from "./credential-generator-history.component";
import { EmptyCredentialHistoryComponent } from "./empty-credential-history.component";

@Component({
  templateUrl: "credential-generator-history-dialog.component.html",
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DialogModule,
    CredentialGeneratorHistoryToolsComponent,
    EmptyCredentialHistoryComponent,
  ],
})
export class CredentialGeneratorHistoryDialogComponent {
  protected readonly hasHistory$ = new BehaviorSubject<boolean>(false);
  protected readonly userId$ = new BehaviorSubject<UserId>(null);

  constructor(
    private accountService: AccountService,
    private history: GeneratorHistoryService,
    private dialogService: DialogService,
    private dialogRef: DialogRef,
  ) {
    this.accountService.activeAccount$
      .pipe(
        takeUntilDestroyed(),
        map(({ id }) => id),
        distinctUntilChanged(),
      )
      .subscribe(this.userId$);

    this.userId$
      .pipe(
        takeUntilDestroyed(),
        switchMap((id) => id && this.history.credentials$(id)),
        map((credentials) => credentials.length > 0),
      )
      .subscribe(this.hasHistory$);
  }

  /** closes the dialog */
  protected close() {
    this.dialogRef.close();
  }

  /** Launches clear history flow */
  protected async clear() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "clearGeneratorHistoryTitle" },
      content: { key: "cleargGeneratorHistoryDescription" },
      type: "warning",
      acceptButtonText: { key: "clearHistory" },
      cancelButtonText: { key: "cancel" },
    });

    if (confirmed) {
      await this.history.clear(await firstValueFrom(this.userId$));
    }
  }
}
