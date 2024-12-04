import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, firstValueFrom, from, lastValueFrom, map } from "rxjs";
import { debounceTime, switchMap, takeUntil } from "rxjs/operators";

import { ProviderService } from "@bitwarden/common/admin-console/abstractions/provider.service";
import { ProviderStatusType, ProviderUserType } from "@bitwarden/common/admin-console/enums";
import { Provider } from "@bitwarden/common/admin-console/models/domain/provider";
import { ProviderOrganizationOrganizationDetailsResponse } from "@bitwarden/common/admin-console/models/response/provider/provider-organization.response";
import { BillingApiServiceAbstraction } from "@bitwarden/common/billing/abstractions";
import { PlanResponse } from "@bitwarden/common/billing/models/response/plan.response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";
import {
  AvatarModule,
  DialogService,
  TableDataSource,
  TableModule,
  ToastService,
} from "@bitwarden/components";
import { SharedOrganizationModule } from "@bitwarden/web-vault/app/admin-console/organizations/shared";
import { HeaderModule } from "@bitwarden/web-vault/app/layouts/header/header.module";

import { WebProviderService } from "../../../admin-console/providers/services/web-provider.service";

import {
  CreateClientDialogResultType,
  openCreateClientDialog,
} from "./create-client-dialog.component";
import {
  ManageClientNameDialogResultType,
  openManageClientNameDialog,
} from "./manage-client-name-dialog.component";
import {
  ManageClientSubscriptionDialogResultType,
  openManageClientSubscriptionDialog,
} from "./manage-client-subscription-dialog.component";
import { vNextNoClientsComponent } from "./vnext-no-clients.component";

@Component({
  templateUrl: "vnext-manage-clients.component.html",
  standalone: true,
  imports: [
    AvatarModule,
    TableModule,
    HeaderModule,
    SharedOrganizationModule,
    vNextNoClientsComponent,
  ],
})
export class vNextManageClientsComponent implements OnInit {
  providerId: string;
  provider: Provider;
  loading = true;
  isProviderAdmin = false;
  clients: ProviderOrganizationOrganizationDetailsResponse[];
  dataSource: TableDataSource<ProviderOrganizationOrganizationDetailsResponse> =
    new TableDataSource();

  protected destroy$ = new Subject<void>();
  protected searchControl = new FormControl("", { nonNullable: true });
  protected plans: PlanResponse[];

  constructor(
    private billingApiService: BillingApiServiceAbstraction,
    private providerService: ProviderService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private toastService: ToastService,
    private validationService: ValidationService,
    private webProviderService: WebProviderService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.parent.params
      .pipe(
        switchMap((params) => {
          this.providerId = params.providerId;
          return this.providerService.get$(this.providerId).pipe(
            map((provider: Provider) => provider?.providerStatus === ProviderStatusType.Billable),
            map((isBillable) => {
              if (!isBillable) {
                return from(
                  this.router.navigate(["../clients"], {
                    relativeTo: this.activatedRoute,
                  }),
                );
              } else {
                return from(this.load());
              }
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this.searchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.dataSource.filter = (data) =>
          data.organizationName.toLowerCase().startsWith(searchText.toLowerCase());
      });
  }

  async load() {
    this.provider = await firstValueFrom(this.providerService.get$(this.providerId));

    this.isProviderAdmin = this.provider.type === ProviderUserType.ProviderAdmin;

    this.clients = (
      await this.billingApiService.getProviderClientOrganizations(this.providerId)
    ).data;

    this.clients.map((client) => (client.plan = client.plan.replace(" (Monthly)", "")));

    this.dataSource.data = this.clients;

    this.plans = (await this.billingApiService.getPlans()).data;

    this.loading = false;
  }

  createClient = async () => {
    const reference = openCreateClientDialog(this.dialogService, {
      data: {
        providerId: this.providerId,
        plans: this.plans,
      },
    });

    const result = await lastValueFrom(reference.closed);

    if (result === CreateClientDialogResultType.Submitted) {
      await this.load();
    }
  };

  manageClientName = async (organization: ProviderOrganizationOrganizationDetailsResponse) => {
    const dialogRef = openManageClientNameDialog(this.dialogService, {
      data: {
        providerId: this.providerId,
        organization: {
          id: organization.id,
          name: organization.organizationName,
          seats: organization.seats,
        },
      },
    });

    const result = await firstValueFrom(dialogRef.closed);

    if (result === ManageClientNameDialogResultType.Submitted) {
      await this.load();
    }
  };

  manageClientSubscription = async (
    organization: ProviderOrganizationOrganizationDetailsResponse,
  ) => {
    const dialogRef = openManageClientSubscriptionDialog(this.dialogService, {
      data: {
        organization,
        provider: this.provider,
      },
    });

    const result = await firstValueFrom(dialogRef.closed);

    if (result === ManageClientSubscriptionDialogResultType.Submitted) {
      await this.load();
    }
  };

  async remove(organization: ProviderOrganizationOrganizationDetailsResponse) {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: organization.organizationName,
      content: { key: "detachOrganizationConfirmation" },
      type: "warning",
    });

    if (!confirmed) {
      return;
    }

    try {
      await this.webProviderService.detachOrganization(this.providerId, organization.id);
      this.toastService.showToast({
        variant: "success",
        title: null,
        message: this.i18nService.t("detachedOrganization", organization.organizationName),
      });
      await this.load();
    } catch (e) {
      this.validationService.showError(e);
    }
  }
}
