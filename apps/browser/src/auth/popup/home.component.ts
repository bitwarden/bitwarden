import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { EnvironmentSelectorComponent } from "@bitwarden/angular/auth/components/environment-selector.component";
import { LoginEmailService } from "@bitwarden/common/auth/abstractions/login-email.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { AccountSwitcherService } from "./account-switching/services/account-switcher.service";

@Component({
  selector: "app-home",
  templateUrl: "home.component.html",
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild(EnvironmentSelectorComponent, { static: true })
  environmentSelector!: EnvironmentSelectorComponent;
  private destroyed$: Subject<void> = new Subject();

  loginInitiated = false;
  formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    rememberEmail: [false],
  });

  constructor(
    protected platformUtilsService: PlatformUtilsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private i18nService: I18nService,
    private environmentService: EnvironmentService,
    private emailService: LoginEmailService,
    private accountSwitcherService: AccountSwitcherService,
  ) {}

  async ngOnInit(): Promise<void> {
    let savedEmail = this.emailService.getEmail();
    const rememberEmail = this.emailService.getRememberEmail();

    if (savedEmail != null) {
      this.formGroup.patchValue({
        email: savedEmail,
        rememberEmail: rememberEmail,
      });
    } else {
      savedEmail = await this.emailService.getStoredEmail();
      if (savedEmail != null) {
        this.formGroup.patchValue({
          email: savedEmail,
          rememberEmail: true,
        });
      }
    }

    this.environmentSelector.onOpenSelfHostedSettings
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.setFormValues();
        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.router.navigate(["environment"]);
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  get availableAccounts$() {
    return this.accountSwitcherService.availableAccounts$;
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccured"),
        this.i18nService.t("invalidEmail"),
      );
      return;
    }

    this.emailService.setEmail(this.formGroup.value.email);
    this.emailService.setRememberEmail(this.formGroup.value.rememberEmail);
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["login"], { queryParams: { email: this.formGroup.value.email } });
  }

  get selfHostedDomain() {
    return this.environmentService.hasBaseUrl() ? this.environmentService.getWebVaultUrl() : null;
  }

  setFormValues() {
    this.emailService.setEmail(this.formGroup.value.email);
    this.emailService.setRememberEmail(this.formGroup.value.rememberEmail);
  }
}
