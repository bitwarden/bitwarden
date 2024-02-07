import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { BillingApiServiceAbstraction as BillingApiService } from "@bitwarden/common/billing/abstractions/billilng-api.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";

type UserOffboardingParams = {
  type: "User";
};

type OrganizationOffboardingParams = {
  type: "Organization";
  id: string;
};

export type OffboardingSurveyDialogParams = UserOffboardingParams | OrganizationOffboardingParams;

export enum OffboardingSurveyDialogResultType {
  Closed = "closed",
  Submitted = "submitted",
}

type Reason = {
  value: string;
  text: string;
};

export const openOffboardingSurvey = (
  dialogService: DialogService,
  dialogConfig: DialogConfig<OffboardingSurveyDialogParams>,
) =>
  dialogService.open<OffboardingSurveyDialogResultType, OffboardingSurveyDialogParams>(
    OffboardingSurveyComponent,
    dialogConfig,
  );

@Component({
  selector: "app-cancel-subscription-form",
  templateUrl: "offboarding-survey.component.html",
})
export class OffboardingSurveyComponent {
  protected ResultType = OffboardingSurveyDialogResultType;
  protected readonly MaxFeedbackLength = 400;

  protected readonly reasons: Reason[] = [
    {
      value: null,
      text: "-- Select --",
    },
    {
      value: "missing_features",
      text: "Missing features",
    },
    {
      value: "switched_service",
      text: "Moving to another tool",
    },
    {
      value: "too_complex",
      text: "Too difficult to use",
    },
    {
      value: "unused",
      text: "Not using enough",
    },
    {
      value: "too_expensive",
      text: "Too expensive",
    },
    {
      value: "other",
      text: "Other",
    },
  ];

  protected formGroup = this.formBuilder.group({
    reason: [this.reasons[0].value, [Validators.required]],
    feedback: ["", [Validators.maxLength(this.MaxFeedbackLength)]],
  });

  constructor(
    @Inject(DIALOG_DATA) private dialogParams: OffboardingSurveyDialogParams,
    private dialogRef: DialogRef<OffboardingSurveyDialogResultType>,
    private formBuilder: FormBuilder,
    private billingApiService: BillingApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
  ) {}

  submit = async () => {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    const request = {
      reason: this.formGroup.value.reason,
      feedback: this.formGroup.value.feedback,
    };

    this.dialogParams.type === "Organization"
      ? await this.billingApiService.cancelOrganizationSubscription(this.dialogParams.id, request)
      : await this.billingApiService.cancelPremiumUserSubscription(request);

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("canceledSubscription"),
    );

    this.dialogRef.close(this.ResultType.Submitted);
  };
}
