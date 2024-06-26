import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { UpdateTwoFactorDuoRequest } from "@bitwarden/common/auth/models/request/update-two-factor-duo.request";
import { TwoFactorDuoResponse } from "@bitwarden/common/auth/models/response/two-factor-duo.response";
import { AuthResponse } from "@bitwarden/common/auth/types/auth-response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";

import { TwoFactorBaseComponent } from "./two-factor-base.component";

@Component({
  selector: "app-two-factor-duo",
  templateUrl: "two-factor-duo.component.html",
})
export class TwoFactorDuoComponent extends TwoFactorBaseComponent {
  @Output() onChangeStatus: EventEmitter<boolean> = new EventEmitter();
  type = TwoFactorProviderType.Duo;
  formGroup = this.formBuilder.group({
    clientId: ["", [Validators.required]],
    clientSecret: ["", [Validators.required]],
    host: ["", [Validators.required]],
  });
  override componentName = "app-two-factor-duo";

  constructor(
    @Inject(DIALOG_DATA) protected data: AuthResponse<TwoFactorDuoResponse>,
    apiService: ApiService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService,
    userVerificationService: UserVerificationService,
    dialogService: DialogService,
    private formBuilder: FormBuilder,
    private dialogRef: DialogRef,
  ) {
    super(
      apiService,
      i18nService,
      platformUtilsService,
      logService,
      userVerificationService,
      dialogService,
    );
  }

  get clientId() {
    return this.formGroup.get("clientId").value;
  }
  get clientSecret() {
    return this.formGroup.get("clientSecret").value;
  }
  get host() {
    return this.formGroup.get("host").value;
  }
  set clientId(value: string) {
    this.formGroup.get("clientId").setValue(value);
  }
  set clientSecret(value: string) {
    this.formGroup.get("clientSecret").setValue(value);
  }
  set host(value: string) {
    this.formGroup.get("host").setValue(value);
  }

  async ngOnInit() {
    super.auth(this.data);
    this.processResponse(this.data.response);
  }

  submit = async () => {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }
    if (this.enabled) {
      await this.disableMethod();
      this.onChangeStatus.emit(this.enabled);
    } else {
      await this.enable();
      this.onChangeStatus.emit(this.enabled);
    }
  };

  protected async enable() {
    const request = await this.buildRequestModel(UpdateTwoFactorDuoRequest);
    request.clientId = this.clientId;
    request.clientSecret = this.clientSecret;
    request.host = this.host;

    let response: TwoFactorDuoResponse;

    if (this.organizationId != null) {
      response = await this.apiService.putTwoFactorOrganizationDuo(this.organizationId, request);
    } else {
      response = await this.apiService.putTwoFactorDuo(request);
    }

    this.processResponse(response);
    this.onUpdated.emit(true);
  }

  onClose = () => {
    this.dialogRef.close(this.enabled);
  };

  private processResponse(response: TwoFactorDuoResponse) {
    this.clientId = response.clientId;
    this.clientSecret = response.clientSecret;
    this.host = response.host;
    this.enabled = response.enabled;
  }

  /**
   * Strongly typed helper to open a TwoFactorDuoComponentComponent
   * @param dialogService Instance of the dialog service that will be used to open the dialog
   * @param config Configuration for the dialog
   */
  static open = (
    dialogService: DialogService,
    config: DialogConfig<AuthResponse<TwoFactorDuoResponse>>,
  ) => {
    return dialogService.open<boolean>(TwoFactorDuoComponent, config);
  };
}
