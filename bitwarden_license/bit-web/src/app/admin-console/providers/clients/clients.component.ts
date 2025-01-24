import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { firstValueFrom, from, map } from "rxjs";
import { debounceTime, first, switchMap } from "rxjs/operators";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { ProviderService } from "@bitwarden/common/admin-console/abstractions/provider.service";
import { ProviderStatusType, ProviderUserType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { ProviderOrganizationOrganizationDetailsResponse } from "@bitwarden/common/admin-console/models/response/provider/provider-organization.response";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { PlanType } from "@bitwarden/common/billing/enums";
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

import { WebProviderService } from "../services/web-provider.service";

import { AddOrganizationComponent } from "./add-organization.component";

const DisallowedPlanTypes = [
  PlanType.Free,
  PlanType.FamiliesAnnually2019,
  PlanType.FamiliesAnnually,
  PlanType.TeamsStarter2023,
  PlanType.TeamsStarter,
];

@Component({
  templateUrl: "clients.component.html",
  standalone: true,
  imports: [
    SharedOrganizationModule,
    HeaderModule,
    CommonModule,
    JslibModule,
    AvatarModule,
    RouterModule,
    TableModule,
  ],
})
export class ClientsComponent {
  providerId: string = "";
  addableOrganizations: Organization[] = [];
  loading = true;
  manageOrganizations = false;
  showAddExisting = false;
  dataSource: TableDataSource<ProviderOrganizationOrganizationDetailsResponse> =
    new TableDataSource();
  protected searchControl = new FormControl("", { nonNullable: true });

  constructor(
    private router: Router,
    private providerService: ProviderService,
    private apiService: ApiService,
    private organizationService: OrganizationService,
    private organizationApiService: OrganizationApiServiceAbstraction,
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private toastService: ToastService,
    private validationService: ValidationService,
    private webProviderService: WebProviderService,
  ) {
    this.activatedRoute.queryParams.pipe(first(), takeUntilDestroyed()).subscribe((queryParams) => {
      this.searchControl.setValue(queryParams.search);
    });

    this.activatedRoute.parent?.params
      ?.pipe(
        switchMap((params) => {
          this.providerId = params.providerId;
          return this.providerService.get$(this.providerId).pipe(
            map((provider) => provider?.providerStatus === ProviderStatusType.Billable),
            map((isBillable) => {
              if (isBillable) {
                return from(
                  this.router.navigate(["../manage-client-organizations"], {
                    relativeTo: this.activatedRoute,
                  }),
                );
              } else {
                return from(this.load());
              }
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.searchControl.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe((searchText) => {
        this.dataSource.filter = (data) =>
          data.organizationName.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
      });
  }

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
        title: "",
        message: this.i18nService.t("detachedOrganization", organization.organizationName),
      });
      await this.load();
    } catch (e) {
      this.validationService.showError(e);
    }
  }

  async load() {
    const response = await this.apiService.getProviderClients(this.providerId);
    const userId = await firstValueFrom(getUserId(this.accountService.activeAccount$));
    const clients = response.data != null && response.data.length > 0 ? response.data : [];
    this.dataSource.data = clients;
    this.manageOrganizations =
      (await this.providerService.get(this.providerId)).type === ProviderUserType.ProviderAdmin;
    const candidateOrgs = (
      await firstValueFrom(this.organizationService.organizations$(userId))
    ).filter((o) => o.isOwner && o.providerId == null);
    const allowedOrgsIds = await Promise.all(
      candidateOrgs.map((o) => this.organizationApiService.get(o.id)),
    ).then((orgs) =>
      orgs.filter((o) => !DisallowedPlanTypes.includes(o.planType)).map((o) => o.id),
    );
    this.addableOrganizations = candidateOrgs.filter((o) => allowedOrgsIds.includes(o.id));

    this.showAddExisting = this.addableOrganizations.length !== 0;
    this.loading = false;
  }

  async addExistingOrganization() {
    const dialogRef = AddOrganizationComponent.open(this.dialogService, {
      providerId: this.providerId,
      organizations: this.addableOrganizations,
    });

    if (await firstValueFrom(dialogRef.closed)) {
      await this.load();
    }
  }
}
