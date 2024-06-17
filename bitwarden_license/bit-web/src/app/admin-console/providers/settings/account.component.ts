import { Component, OnDestroy } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, switchMap, takeUntil } from "rxjs";

import { UserVerificationDialogComponent } from "@bitwarden/auth/angular";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ProviderApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/provider/provider-api.service.abstraction";
import { ProviderUpdateRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-update.request";
import { ProviderResponse } from "@bitwarden/common/admin-console/models/response/provider/provider.response";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { DialogService } from "@bitwarden/components";

@Component({
  selector: "provider-account",
  templateUrl: "account.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class AccountComponent implements OnDestroy {
  selfHosted = false;
  loading = true;
  provider: ProviderResponse;
  taxFormPromise: Promise<any>;

  private destroy$ = new Subject<void>();
  private providerId: string;
  protected formGroup = this.formBuilder.group({
    providerName: ["" as ProviderResponse["name"]],
    providerBillingEmail: ["" as ProviderResponse["billingEmail"], Validators.email],
  });
  protected enableDeleteProvider$ = this.configService.getFeatureFlag$(
    FeatureFlag.EnableDeleteProvider,
  );

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private syncService: SyncService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private dialogService: DialogService,
    private configService: ConfigService,
    private providerApiService: ProviderApiServiceAbstraction,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.selfHosted = this.platformUtilsService.isSelfHost();
    this.route.parent.parent.params
      .pipe(
        switchMap(async (params) => {
          this.providerId = params.providerId;
          try {
            this.provider = await this.providerApiService.getProvider(this.providerId);
            this.formGroup.patchValue({
              providerName: this.provider.name,
              providerBillingEmail: this.provider.billingEmail,
            });
          } catch (e) {
            this.logService.error(`Handled exception: ${e}`);
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
    this.loading = false;
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  submit = async () => {
    const request = new ProviderUpdateRequest();
    request.name = this.formGroup.get("providerName").value;
    request.businessName = this.formGroup.get("providerName").value;
    request.billingEmail = this.formGroup.get("providerBillingEmail").value;

    await this.providerApiService.putProvider(this.providerId, request);
    await this.syncService.fullSync(true);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("providerUpdated"));
    this.provider = await this.providerApiService.getProvider(this.providerId);
  };

  async deleteProvider() {
    const providerClients = await this.apiService.getProviderClients(this.providerId);
    if (providerClients.data != null && providerClients.data.length > 0) {
      await this.dialogService.openSimpleDialog({
        title: { key: "deleteProviderName", placeholders: [this.provider.name] },
        content: { key: "deleteProviderWarningDescription", placeholders: [this.provider.name] },
        acceptButtonText: { key: "ok" },
        cancelButtonText: { key: "close" },
        type: "danger",
      });

      return false;
    }

    const userVerified = await this.verifyUser();
    if (!userVerified) {
      return;
    }

    try {
      await this.providerApiService.deleteProvider(this.providerId);
      this.platformUtilsService.showToast(
        "success",
        this.i18nService.t("providerDeleted"),
        this.i18nService.t("providerDeletedDesc"),
      );
    } catch (e) {
      this.logService.error(e);
    }
    await this.router.navigate(["/"]);
  }

  private async verifyUser(): Promise<boolean> {
    const confirmDescription = "deleteProviderConfirmation";
    const result = await UserVerificationDialogComponent.open(this.dialogService, {
      title: "deleteProvider",
      bodyText: confirmDescription,
      confirmButtonOptions: {
        text: "deleteProvider",
        type: "danger",
      },
    });

    // Handle the result of the dialog based on user action and verification success
    if (result.userAction === "cancel") {
      // User cancelled the dialog
      return false;
    }

    // User confirmed the dialog so check verification success
    if (!result.verificationSuccess) {
      return false;
    }
    return true;
  }
}
