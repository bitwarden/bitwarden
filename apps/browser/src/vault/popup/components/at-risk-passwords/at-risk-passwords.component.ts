import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { combineLatest, map, of, shareReplay, startWith, switchMap } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  getOrganizationById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AutofillSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  BadgeComponent,
  ButtonModule,
  CalloutModule,
  ItemModule,
  ToastService,
  TypographyModule,
} from "@bitwarden/components";
import {
  filterOutNullish,
  OrgIconDirective,
  PasswordRepromptService,
  SecurityTaskType,
  TaskService,
} from "@bitwarden/vault";

import { PopOutComponent } from "../../../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../../../platform/popup/layout/popup-page.component";

@Component({
  selector: "vault-at-risk-passwords",
  standalone: true,
  imports: [
    PopupPageComponent,
    PopupHeaderComponent,
    PopOutComponent,
    ItemModule,
    CommonModule,
    JslibModule,
    BadgeComponent,
    TypographyModule,
    OrgIconDirective,
    CalloutModule,
    ButtonModule,
  ],
  templateUrl: "./at-risk-passwords.component.html",
})
export class AtRiskPasswordsComponent {
  private taskService = inject(TaskService);
  private organizationService = inject(OrganizationService);
  private cipherService = inject(CipherService);
  private i18nService = inject(I18nService);
  private accountService = inject(AccountService);
  private platformUtilsService = inject(PlatformUtilsService);
  private passwordRepromptService = inject(PasswordRepromptService);
  private router = inject(Router);
  private autofillSettingsService = inject(AutofillSettingsServiceAbstraction);
  private toastService = inject(ToastService);

  private activeUserData$ = this.accountService.activeAccount$.pipe(
    filterOutNullish(),
    switchMap((user) =>
      combineLatest([
        this.taskService.pendingTasks$(user.id),
        this.cipherService.cipherViews$.pipe(
          filterOutNullish(),
          map((ciphers) => Object.fromEntries(ciphers.map((c) => [c.id, c]))),
        ),
        of(user),
      ]),
    ),
    map(([tasks, ciphers, user]) => ({
      tasks,
      ciphers,
      userId: user.id,
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected loading$ = this.activeUserData$.pipe(
    map(() => false),
    startWith(true),
  );

  protected autofillOnPageLoad$ = this.autofillSettingsService.autofillOnPageLoad$;
  protected calloutDismissed = signal(false);

  protected atRiskItems$ = this.activeUserData$.pipe(
    map(({ tasks, ciphers }) =>
      tasks
        .filter(
          (t) =>
            t.type === SecurityTaskType.UpdateAtRiskCredential &&
            t.cipherId != null &&
            ciphers[t.cipherId] != null,
        )
        .map((t) => ciphers[t.cipherId!]),
    ),
  );

  protected pageDescription$ = this.activeUserData$.pipe(
    switchMap(({ tasks, userId }) => {
      const orgIds = new Set(tasks.map((t) => t.organizationId));
      if (orgIds.size === 1) {
        const [orgId] = orgIds;
        return this.organizationService.organizations$(userId).pipe(
          getOrganizationById(orgId),
          map((org) => this.i18nService.t("atRiskPasswordsDescSingleOrg", org?.name, tasks.length)),
        );
      }

      return of(this.i18nService.t("atRiskPasswordsDescMultiOrg", tasks.length));
    }),
  );

  async viewCipher(cipher: CipherView) {
    const repromptPassed = await this.passwordRepromptService.passwordRepromptCheck(cipher);
    if (!repromptPassed) {
      return;
    }
    await this.router.navigate(["/view-cipher"], {
      queryParams: { cipherId: cipher.id, type: cipher.type },
    });
  }

  async launchChangePassword(cipher: CipherView) {
    if (cipher.login?.uri) {
      this.platformUtilsService.launchUri(cipher.login.uri);
    }
  }

  async activateAutofillOnPageLoad() {
    await this.autofillSettingsService.setAutofillOnPageLoad(true);
    this.toastService.showToast({
      variant: "success",
      message: this.i18nService.t("turnedOnAutofill"),
      title: "",
    });
  }
}
