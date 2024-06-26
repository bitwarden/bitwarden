import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject, concatMap, takeUntil } from "rxjs";

import { openAddAccountCreditDialog } from "@bitwarden/angular/billing/components";
import { BillingApiServiceAbstraction } from "@bitwarden/common/billing/abstractions/billilng-api.service.abstraction";
import { TaxInformation } from "@bitwarden/common/billing/models/domain";
import { ExpandedTaxInfoUpdateRequest } from "@bitwarden/common/billing/models/request/expanded-tax-info-update.request";
import {
  ProviderPlanResponse,
  ProviderSubscriptionResponse,
} from "@bitwarden/common/billing/models/response/provider-subscription-response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { DialogService, ToastService } from "@bitwarden/components";

@Component({
  selector: "app-provider-subscription",
  templateUrl: "./provider-subscription.component.html",
})
export class ProviderSubscriptionComponent {
  providerId: string;
  subscription: ProviderSubscriptionResponse;

  firstLoaded = false;
  loading: boolean;
  private destroy$ = new Subject<void>();
  totalCost: number;
  currentDate = new Date();

  constructor(
    private billingApiService: BillingApiServiceAbstraction,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    this.route.params
      .pipe(
        concatMap(async (params) => {
          this.providerId = params.providerId;
          await this.load();
          this.firstLoaded = true;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  get isExpired() {
    return this.subscription.status !== "active";
  }

  async load() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.subscription = await this.billingApiService.getProviderSubscription(this.providerId);
    this.totalCost =
      ((100 - this.subscription.discountPercentage) / 100) * this.sumCost(this.subscription.plans);
    this.loading = false;
  }

  addAccountCredit = () =>
    openAddAccountCreditDialog(this.dialogService, {
      data: {
        providerId: this.providerId,
      },
    });

  updateTaxInformation = async (taxInformation: TaxInformation) => {
    const request = ExpandedTaxInfoUpdateRequest.From(taxInformation);
    await this.billingApiService.updateProviderTaxInformation(this.providerId, request);
    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("updatedTaxInformation"),
    });
  };

  getFormattedCost(
    cost: number,
    seatMinimum: number,
    purchasedSeats: number,
    discountPercentage: number,
  ): number {
    const costPerSeat = cost / (seatMinimum + purchasedSeats);
    return costPerSeat - (costPerSeat * discountPercentage) / 100;
  }

  getFormattedPlanName(planName: string): string {
    const spaceIndex = planName.indexOf(" ");
    return planName.substring(0, spaceIndex);
  }

  getFormattedSeatCount(seatMinimum: number, purchasedSeats: number): string {
    const totalSeats = seatMinimum + purchasedSeats;
    return totalSeats > 1 ? totalSeats.toString() : "";
  }

  sumCost(plans: ProviderPlanResponse[]): number {
    return plans.reduce((acc, plan) => acc + plan.cost, 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected readonly TaxInformation = TaxInformation;
}
