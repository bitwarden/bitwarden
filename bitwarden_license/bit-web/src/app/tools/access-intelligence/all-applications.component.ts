import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, debounceTime, firstValueFrom, map, Observable, of, skipWhile } from "rxjs";

import {
  CriticalAppsService,
  RiskInsightsDataService,
  RiskInsightsReportService,
} from "@bitwarden/bit-common/tools/reports/risk-insights";
import {
  ApplicationHealthReportDetail,
  ApplicationHealthReportDetailWithCriticalFlag,
  ApplicationHealthReportSummary,
} from "@bitwarden/bit-common/tools/reports/risk-insights/models/password-health";
import {
  getOrganizationById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import {
  DialogService,
  Icons,
  NoItemsModule,
  SearchModule,
  TableDataSource,
  ToastService,
} from "@bitwarden/components";
import { CardComponent } from "@bitwarden/tools-card";
import { HeaderModule } from "@bitwarden/web-vault/app/layouts/header/header.module";
import { SharedModule } from "@bitwarden/web-vault/app/shared";
import { PipesModule } from "@bitwarden/web-vault/app/vault/individual-vault/pipes/pipes.module";

import { openAppAtRiskMembersDialog } from "./app-at-risk-members-dialog.component";
import { OrgAtRiskAppsDialogComponent } from "./org-at-risk-apps-dialog.component";
import { OrgAtRiskMembersDialogComponent } from "./org-at-risk-members-dialog.component";
import { ApplicationsLoadingComponent } from "./risk-insights-loading.component";

@Component({
  standalone: true,
  selector: "tools-all-applications",
  templateUrl: "./all-applications.component.html",
  imports: [
    ApplicationsLoadingComponent,
    HeaderModule,
    CardComponent,
    SearchModule,
    PipesModule,
    NoItemsModule,
    SharedModule,
  ],
})
export class AllApplicationsComponent implements OnInit {
  protected dataSource = new TableDataSource<ApplicationHealthReportDetailWithCriticalFlag>();
  protected selectedUrls: Set<string> = new Set<string>();
  protected searchControl = new FormControl("", { nonNullable: true });
  protected loading = true;
  protected organization = {} as Organization;
  noItemsIcon = Icons.Security;
  protected markingAsCritical = false;
  protected applicationSummary = {} as ApplicationHealthReportSummary;

  destroyRef = inject(DestroyRef);
  isLoading$: Observable<boolean> = of(false);
  isCriticalAppsFeatureEnabled = false;

  async ngOnInit() {
    this.isCriticalAppsFeatureEnabled = await this.configService.getFeatureFlag(
      FeatureFlag.CriticalApps,
    );

    const organizationId = this.activatedRoute.snapshot.paramMap.get("organizationId") ?? "";
    const userId = await firstValueFrom(getUserId(this.accountService.activeAccount$));

    if (organizationId) {
      const organization$ = this.organizationService
        .organizations$(userId)
        .pipe(getOrganizationById(organizationId));

      const organization = await firstValueFrom(organization$);

      if (organization) {
        this.organization = organization;
      } else {
        throw new Error("No organization found.");
      }

      combineLatest([
        this.dataService.applications$,
        this.criticalAppsService.getAppsListForOrg(organizationId),
        organization$,
      ])
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          skipWhile(([_, __, organization]) => !organization),
          map(([applications, criticalApps, organization]) => {
            const criticalUrls = criticalApps.map((ca) => ca.uri);
            const data = applications?.map((app) => ({
              ...app,
              isMarkedAsCritical: criticalUrls.includes(app.applicationName),
            })) as ApplicationHealthReportDetailWithCriticalFlag[];
            return { data, organization };
          }),
        )
        .subscribe(({ data, organization }) => {
          this.dataSource.data = data ?? [];
          this.applicationSummary = this.reportService.generateApplicationsSummary(data ?? []);
          if (organization) {
            this.organization = organization;
          }
        });

      this.isLoading$ = this.dataService.isLoading$;
    }
  }

  constructor(
    protected cipherService: CipherService,
    protected i18nService: I18nService,
    protected activatedRoute: ActivatedRoute,
    protected toastService: ToastService,
    protected configService: ConfigService,
    protected dataService: RiskInsightsDataService,
    protected organizationService: OrganizationService,
    protected reportService: RiskInsightsReportService,
    private accountService: AccountService,
    protected criticalAppsService: CriticalAppsService,
    protected dialogService: DialogService,
  ) {
    this.searchControl.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe((v) => (this.dataSource.filter = v));
  }

  goToCreateNewLoginItem = async () => {
    // TODO: implement
    this.toastService.showToast({
      variant: "warning",
      title: "",
      message: "Not yet implemented",
    });
  };

  isMarkedAsCriticalItem(applicationName: string) {
    return this.selectedUrls.has(applicationName);
  }

  markAppsAsCritical = async () => {
    this.markingAsCritical = true;

    try {
      await this.criticalAppsService.setCriticalApps(
        this.organization.id,
        Array.from(this.selectedUrls),
      );

      this.toastService.showToast({
        variant: "success",
        title: "",
        message: this.i18nService.t("appsMarkedAsCritical"),
      });
    } finally {
      this.selectedUrls.clear();
      this.markingAsCritical = false;
    }
  };

  trackByFunction(_: number, item: ApplicationHealthReportDetail) {
    return item.applicationName;
  }

  showAppAtRiskMembers = async (applicationName: string) => {
    openAppAtRiskMembersDialog(this.dialogService, {
      members:
        this.dataSource.data.find((app) => app.applicationName === applicationName)
          ?.atRiskMemberDetails ?? [],
      applicationName,
    });
  };

  showOrgAtRiskMembers = async () => {
    this.dialogService.open(OrgAtRiskMembersDialogComponent, {
      data: this.reportService.generateAtRiskMemberList(this.dataSource.data),
    });
  };

  showOrgAtRiskApps = async () => {
    this.dialogService.open(OrgAtRiskAppsDialogComponent, {
      data: this.reportService.generateAtRiskApplicationList(this.dataSource.data),
    });
  };

  onCheckboxChange(applicationName: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedUrls.add(applicationName);
    } else {
      this.selectedUrls.delete(applicationName);
    }
  }

  getSelectedUrls = () => Array.from(this.selectedUrls);
}
