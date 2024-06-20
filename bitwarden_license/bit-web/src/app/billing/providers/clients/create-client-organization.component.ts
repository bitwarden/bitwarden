import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { BillingApiServiceAbstraction } from "@bitwarden/common/billing/abstractions/billilng-api.service.abstraction";
import { PlanType } from "@bitwarden/common/billing/enums";
import { PlanResponse } from "@bitwarden/common/billing/models/response/plan.response";
import { ProviderPlanResponse } from "@bitwarden/common/billing/models/response/provider-subscription-response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { DialogService, ToastService } from "@bitwarden/components";

import { WebProviderService } from "../../../admin-console/providers/services/web-provider.service";

type CreateClientOrganizationParams = {
  providerId: string;
  plans: PlanResponse[];
};

export enum CreateClientOrganizationResultType {
  Closed = "closed",
  Submitted = "submitted",
}

export const openCreateClientOrganizationDialog = (
  dialogService: DialogService,
  dialogConfig: DialogConfig<CreateClientOrganizationParams>,
) =>
  dialogService.open<CreateClientOrganizationResultType, CreateClientOrganizationParams>(
    CreateClientOrganizationComponent,
    dialogConfig,
  );

type PlanCard = {
  name: string;
  cost: number;
  type: PlanType;
  plan: PlanResponse;
  selected: boolean;
};

@Component({
  selector: "app-create-client-organization",
  templateUrl: "./create-client-organization.component.html",
})
export class CreateClientOrganizationComponent implements OnInit {
  protected formGroup = this.formBuilder.group({
    clientOwnerEmail: ["", [Validators.required, Validators.email]],
    organizationName: ["", Validators.required],
    seats: [null, [Validators.required, Validators.min(1)]],
  });
  protected loading = true;
  protected planCards: PlanCard[];
  protected ResultType = CreateClientOrganizationResultType;

  private providerPlans: ProviderPlanResponse[];

  constructor(
    private billingApiService: BillingApiServiceAbstraction,
    @Inject(DIALOG_DATA) private dialogParams: CreateClientOrganizationParams,
    private dialogRef: DialogRef<CreateClientOrganizationResultType>,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    private toastService: ToastService,
    private webProviderService: WebProviderService,
  ) {}

  protected getPlanCardContainerClasses(selected: boolean) {
    switch (selected) {
      case true: {
        return [
          "tw-group",
          "tw-cursor-pointer",
          "tw-block",
          "tw-rounded",
          "tw-border",
          "tw-border-solid",
          "tw-border-primary-600",
          "hover:tw-border-primary-700",
          "focus:tw-border-2",
          "focus:tw-border-primary-700",
          "focus:tw-rounded-lg",
        ];
      }
      case false: {
        return [
          "tw-cursor-pointer",
          "tw-block",
          "tw-rounded",
          "tw-border",
          "tw-border-solid",
          "tw-border-secondary-300",
          "hover:tw-border-text-main",
          "focus:tw-border-2",
          "focus:tw-border-primary-700",
        ];
      }
    }
  }

  async ngOnInit(): Promise<void> {
    const subscription = await this.billingApiService.getProviderSubscription(
      this.dialogParams.providerId,
    );
    this.providerPlans = subscription?.plans ?? [];

    const teamsPlan = this.dialogParams.plans.find((plan) => plan.type === PlanType.TeamsMonthly);
    const enterprisePlan = this.dialogParams.plans.find(
      (plan) => plan.type === PlanType.EnterpriseMonthly,
    );

    this.planCards = [
      {
        name: this.i18nService.t("planNameTeams"),
        cost: teamsPlan.PasswordManager.providerPortalSeatPrice * 0.65, // 35% off for MSPs,
        type: teamsPlan.type,
        plan: teamsPlan,
        selected: true,
      },
      {
        name: this.i18nService.t("planNameEnterprise"),
        cost: enterprisePlan.PasswordManager.providerPortalSeatPrice * 0.65, // 35% off for MSPs,
        type: enterprisePlan.type,
        plan: enterprisePlan,
        selected: false,
      },
    ];

    this.loading = false;
  }

  protected selectPlan(name: string) {
    this.planCards.find((planCard) => planCard.name === name).selected = true;
    this.planCards.find((planCard) => planCard.name !== name).selected = false;
  }

  submit = async () => {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    const selectedPlanCard = this.planCards.find((planCard) => planCard.selected);

    await this.webProviderService.createClientOrganization(
      this.dialogParams.providerId,
      this.formGroup.value.organizationName,
      this.formGroup.value.clientOwnerEmail,
      selectedPlanCard.type,
      this.formGroup.value.seats,
    );

    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("createdNewClient"),
    });

    this.dialogRef.close(this.ResultType.Submitted);
  };

  protected get unassignedSeatsForSelectedPlan(): number {
    if (this.loading || !this.planCards) {
      return 0;
    }
    const selectedPlan = this.planCards.find((planCard) => planCard.selected).plan;
    const selectedProviderPlan = this.providerPlans.find(
      (providerPlan) => providerPlan.planName === selectedPlan.name,
    );
    return selectedProviderPlan.seatMinimum - selectedProviderPlan.assignedSeats;
  }
}
