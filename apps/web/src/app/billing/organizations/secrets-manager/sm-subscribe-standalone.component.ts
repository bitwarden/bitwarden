import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { SecretsManagerSubscribeRequest } from "@bitwarden/common/billing/models/request/sm-subscribe.request";
import { PlanResponse } from "@bitwarden/common/billing/models/response/plan.response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { secretsManagerSubscribeFormFactory } from "./sm-subscribe.component";

@Component({
  selector: "sm-subscribe-standalone",
  templateUrl: "sm-subscribe-standalone.component.html",
})
export class SecretsManagerSubscribeStandaloneComponent {
  @Input() plan: PlanResponse;
  @Input() organization: Organization;
  @Output() onSubscribe = new EventEmitter<void>();

  formGroup = secretsManagerSubscribeFormFactory(this.formBuilder);

  formPromise: Promise<void>;

  constructor(
    private formBuilder: FormBuilder,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private i18nService: I18nService,
    private organizationApiService: OrganizationApiServiceAbstraction
  ) {}

  submit = async () => {
    const request = new SecretsManagerSubscribeRequest();
    request.userSeats = this.formGroup.value.userSeats;
    request.additionalServiceAccounts = this.formGroup.value.additionalServiceAccounts;

    this.formPromise = this.organizationApiService.subscribeToSecretsManager(
      this.organization.id,
      request
    );

    await this.formPromise;

    try {
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("subscriptionUpdated")
      );
    } catch (e) {
      this.logService.error(e);
    }

    this.onSubscribe.emit();
  };
}
