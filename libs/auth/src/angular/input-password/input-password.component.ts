import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { Subject, firstValueFrom, map, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { KdfConfigService } from "@bitwarden/common/auth/abstractions/kdf-config.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import {
  AsyncActionsModule,
  ButtonModule,
  CheckboxModule,
  DialogService,
  FormFieldModule,
  IconButtonModule,
  InputModule,
  ToastService,
} from "@bitwarden/components";

import { PreloadedEnglishI18nModule } from "../../../../../apps/web/src/app/core/tests";
import { InputsFieldMatch } from "../../../../angular/src/auth/validators/inputs-field-match.validator";
import { SharedModule } from "../../../../components/src/shared";
import { PasswordCalloutComponent } from "../password-callout/password-callout.component";

export interface PasswordInput {
  password: string;
  hint?: string;
}

@Component({
  standalone: true,
  selector: "auth-input-password",
  templateUrl: "./input-password.component.html",
  imports: [
    AsyncActionsModule,
    ButtonModule,
    CheckboxModule,
    FormFieldModule,
    IconButtonModule,
    InputModule,
    ReactiveFormsModule,
    SharedModule,
    PasswordCalloutComponent,
    JslibModule,
  ],
})
export class InputPasswordComponent implements OnInit {
  @Output() onPasswordFormSubmit = new EventEmitter();

  @Input() protected buttonText: string;
  @Input() private orgName: string;
  @Input() private orgId: string;

  private minHintLength = 0;
  protected maxHintLength = 50;

  protected email: string;
  protected minPasswordLength = Utils.minimumPasswordLength;
  protected masterPasswordPolicy: MasterPasswordPolicyOptions;
  protected passwordStrengthResult: any;
  protected showErrorSummary = false;

  protected formGroup = this.formBuilder.group(
    {
      password: ["", [Validators.required, Validators.minLength(this.minPasswordLength)]],
      confirmedPassword: ["", [Validators.required]],
      // TODO-rr-bw: solve bug where hint error is thrown if password is "" and user clicks away
      hint: [
        "",
        [
          Validators.maxLength(this.maxHintLength),
          // InputsFieldMatch.validateInputsDoesntMatch(
          //   "password",
          //   this.i18nService.t("hintEqualsPassword"),
          // ),
        ],
      ],
      checkForBreaches: true,
    },
    // TODO-rr-bw: fix this (don't use deprecated .group() feature)
    {
      validator: InputsFieldMatch.validateFormInputsMatch(
        "password",
        "confirmedPassword",
        this.i18nService.t("masterPassDoesntMatch"),
      ),
    },
  );

  protected destroy$ = new Subject<void>();

  constructor(
    private accountService: AccountService,
    private auditService: AuditService,
    // private cryptoService: CryptoService,
    private dialogService: DialogService,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    // private kdfConfigService: KdfConfigService,
    // private policyService: PolicyService,
    // private toastService: ToastService,
    // private policyApiService: PolicyApiServiceAbstraction,
  ) {}

  async ngOnInit() {
    this.email = await firstValueFrom(
      this.accountService.activeAccount$.pipe(map((a) => a?.email)),
    );

    // this.masterPasswordPolicy = await this.policyApiService.getMasterPasswordPolicyOptsForOrgUser(
    //   this.orgId,
    // );

    // this.policyService
    //   .masterPasswordPolicyOptions$()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(
    //     (masterPasswordPolicyOptions) =>
    //       (this.masterPasswordPolicy ??= masterPasswordPolicyOptions),
    //   );
  }

  // getPasswordStrengthResult(result: any) {
  //   this.passwordStrengthResult = result;
  // }

  protected submit = async () => {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      console.log("returning... (form is invalid)");
      this.showErrorSummary = true;
      return;
    }

    // Check if password is breached (if breached, user chooses to accept and continue or not)
    const passwordIsBreached =
      this.formGroup.controls.checkForBreaches.value &&
      (await this.auditService.passwordLeaked(this.formGroup.controls.password.value));

    if (passwordIsBreached) {
      const userAcceptedDialog = await this.dialogService.openSimpleDialog({
        title: { key: "exposedMasterPassword" },
        content: { key: "exposedMasterPasswordDesc" },
        type: "warning",
      });

      if (!userAcceptedDialog) {
        return;
      }
    }

    // Check if password meets org policy requirements
    // if (
    //   this.masterPasswordPolicy != null &&
    //   !this.policyService.evaluateMasterPassword(
    //     this.passwordStrengthResult.score,
    //     this.formGroup.controls.password.value,
    //     this.masterPasswordPolicy,
    //   )
    // ) {
    //   this.toastService.showToast({
    //     variant: "error",
    //     title: this.i18nService.t("errorOccurred"),
    //     message: this.i18nService.t("masterPasswordPolicyRequirementsNotMet"),
    //   });

    //   return;
    // }

    // Create and hash new master key
    // const masterPassword = this.formGroup.controls.password.value;
    // const email = await firstValueFrom(
    //   this.accountService.activeAccount$.pipe(map((a) => a?.email)),
    // );
    // const kdfConfig = await this.kdfConfigService.getKdfConfig();

    // const newMasterKey = await this.cryptoService.makeMasterKey(
    //   masterPassword,
    //   email.trim().toLowerCase(), // TODO-rr-bw: check if it's ok to use same email retrieved during ngOnInit
    //   kdfConfig,
    // );
    // const newMasterKeyHash = await this.cryptoService.hashMasterKey(masterPassword, newMasterKey);

    const passwordInput = {
      password: this.formGroup.controls.password.value,
      hint: this.formGroup.controls.hint.value,
    };

    console.log("reached end -> passwordInput", passwordInput);
    this.onPasswordFormSubmit.emit(passwordInput as PasswordInput);
  };
}
