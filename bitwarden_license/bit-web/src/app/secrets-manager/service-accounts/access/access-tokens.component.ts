import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { combineLatestWith, firstValueFrom, Observable, startWith, switchMap } from "rxjs";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { openUserVerificationPrompt } from "@bitwarden/web-vault/app/auth/shared/components/user-verification";

import { AccessTokenView } from "../models/view/access-token.view";

import { AccessService } from "./access.service";
import { AccessTokenCreateDialogComponent } from "./dialogs/access-token-create-dialog.component";

@Component({
  selector: "sm-access-tokens",
  templateUrl: "./access-tokens.component.html",
})
export class AccessTokenComponent implements OnInit {
  accessTokens$: Observable<AccessTokenView[]>;

  private serviceAccountId: string;
  private organizationId: string;

  constructor(
    private route: ActivatedRoute,
    private accessService: AccessService,
    private dialogService: DialogServiceAbstraction,
    private modalService: ModalService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService
  ) {}

  ngOnInit() {
    this.accessTokens$ = this.accessService.accessToken$.pipe(
      startWith(null),
      combineLatestWith(this.route.params),
      switchMap(async ([_, params]) => {
        this.organizationId = params.organizationId;
        this.serviceAccountId = params.serviceAccountId;
        return await this.getAccessTokens();
      })
    );
  }

  protected async revoke(tokens: AccessTokenView[]) {
    if (!tokens?.length) {
      this.platformUtilsService.showToast(
        "error",
        null,
        this.i18nService.t("noAccessTokenSelected")
      );
      return;
    }

    if (!(await this.verifyUser())) {
      return;
    }

    await this.accessService.revokeAccessTokens(
      this.serviceAccountId,
      tokens.map((t) => t.id)
    );

    this.platformUtilsService.showToast("success", null, this.i18nService.t("accessTokenRevoked"));
  }

  protected openNewAccessTokenDialog() {
    AccessTokenCreateDialogComponent.openNewAccessTokenDialog(
      this.dialogService,
      this.serviceAccountId,
      this.organizationId
    );
  }

  private verifyUser() {
    const ref = openUserVerificationPrompt(this.dialogService, {
      data: {
        confirmDescription: "revokeAccessTokenDesc",
        confirmButtonText: "revokeAccessToken",
        modalTitle: "revokeAccessToken",
      },
    });

    if (ref == null) {
      return;
    }

    return firstValueFrom(ref.closed);
  }

  private async getAccessTokens(): Promise<AccessTokenView[]> {
    return await this.accessService.getAccessTokens(this.organizationId, this.serviceAccountId);
  }
}
