import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import {
  BehaviorSubject,
  combineLatest,
  concatMap,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  Observable,
  pairwise,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs";

import { FingerprintDialogComponent } from "@bitwarden/auth/angular";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { VaultTimeoutService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { DeviceType } from "@bitwarden/common/enums";
import { VaultTimeoutAction } from "@bitwarden/common/enums/vault-timeout-action.enum";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { BiometricStateService } from "@bitwarden/common/platform/biometrics/biometric-state.service";
import { DialogService } from "@bitwarden/components";

import { SetPinComponent } from "../../auth/popup/components/set-pin.component";
import { BiometricErrors, BiometricErrorTypes } from "../../models/biometricErrors";
import { BrowserApi } from "../../platform/browser/browser-api";
import { enableAccountSwitching } from "../../platform/flags";
import BrowserPopupUtils from "../../platform/popup/browser-popup-utils";

import { AboutComponent } from "./about.component";
import { AwaitDesktopDialogComponent } from "./await-desktop-dialog.component";

const RateUrls = {
  [DeviceType.ChromeExtension]:
    "https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews",
  [DeviceType.FirefoxExtension]:
    "https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/#reviews",
  [DeviceType.OperaExtension]:
    "https://addons.opera.com/en/extensions/details/bitwarden-free-password-manager/#feedback-container",
  [DeviceType.EdgeExtension]:
    "https://microsoftedge.microsoft.com/addons/detail/jbkfoedolllekgbhcbcoahefnbanhhlh",
  [DeviceType.VivaldiExtension]:
    "https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews",
  [DeviceType.SafariExtension]: "https://apps.apple.com/app/bitwarden/id1352778147",
};

@Component({
  selector: "app-settings",
  templateUrl: "settings.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class SettingsComponent implements OnInit {
  protected readonly VaultTimeoutAction = VaultTimeoutAction;

  availableVaultTimeoutActions: VaultTimeoutAction[] = [];
  vaultTimeoutOptions: any[];
  vaultTimeoutPolicyCallout: Observable<{
    timeout: { hours: number; minutes: number };
    action: VaultTimeoutAction;
  }>;
  supportsBiometric: boolean;
  showChangeMasterPass = true;
  accountSwitcherEnabled = false;

  form = this.formBuilder.group({
    vaultTimeout: [null as number | null],
    vaultTimeoutAction: [VaultTimeoutAction.Lock],
    pin: [null as boolean | null],
    biometric: false,
    enableAutoBiometricsPrompt: true,
  });

  private refreshTimeoutSettings$ = new BehaviorSubject<void>(undefined);
  private destroy$ = new Subject<void>();

  constructor(
    private policyService: PolicyService,
    private formBuilder: FormBuilder,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private vaultTimeoutService: VaultTimeoutService,
    private vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    public messagingService: MessagingService,
    private router: Router,
    private environmentService: EnvironmentService,
    private cryptoService: CryptoService,
    private stateService: StateService,
    private userVerificationService: UserVerificationService,
    private dialogService: DialogService,
    private changeDetectorRef: ChangeDetectorRef,
    private biometricStateService: BiometricStateService,
    private accountService: AccountService,
  ) {
    this.accountSwitcherEnabled = enableAccountSwitching();
  }

  async ngOnInit() {
    const maximumVaultTimeoutPolicy = this.policyService.get$(PolicyType.MaximumVaultTimeout);
    this.vaultTimeoutPolicyCallout = maximumVaultTimeoutPolicy.pipe(
      filter((policy) => policy != null),
      map((policy) => {
        let timeout;
        if (policy.data?.minutes) {
          timeout = {
            hours: Math.floor(policy.data?.minutes / 60),
            minutes: policy.data?.minutes % 60,
          };
        }
        return { timeout: timeout, action: policy.data?.action };
      }),
    );

    const showOnLocked =
      !this.platformUtilsService.isFirefox() && !this.platformUtilsService.isSafari();

    this.vaultTimeoutOptions = [
      { name: this.i18nService.t("immediately"), value: 0 },
      { name: this.i18nService.t("oneMinute"), value: 1 },
      { name: this.i18nService.t("fiveMinutes"), value: 5 },
      { name: this.i18nService.t("fifteenMinutes"), value: 15 },
      { name: this.i18nService.t("thirtyMinutes"), value: 30 },
      { name: this.i18nService.t("oneHour"), value: 60 },
      { name: this.i18nService.t("fourHours"), value: 240 },
      // { name: i18nService.t('onIdle'), value: -4 },
      // { name: i18nService.t('onSleep'), value: -3 },
    ];

    if (showOnLocked) {
      this.vaultTimeoutOptions.push({ name: this.i18nService.t("onLocked"), value: -2 });
    }

    this.vaultTimeoutOptions.push({ name: this.i18nService.t("onRestart"), value: -1 });
    this.vaultTimeoutOptions.push({ name: this.i18nService.t("never"), value: null });

    const activeAccount = await firstValueFrom(this.accountService.activeAccount$);

    let timeout = await firstValueFrom(
      this.vaultTimeoutSettingsService.getVaultTimeoutByUserId$(activeAccount.id),
    );
    if (timeout === -2 && !showOnLocked) {
      timeout = -1;
    }
    const pinStatus = await this.vaultTimeoutSettingsService.isPinLockSet();

    this.form.controls.vaultTimeout.valueChanges
      .pipe(
        pairwise(),
        concatMap(async ([previousValue, newValue]) => {
          await this.saveVaultTimeout(previousValue, newValue);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this.form.controls.vaultTimeoutAction.valueChanges
      .pipe(
        pairwise(),
        concatMap(async ([previousValue, newValue]) => {
          await this.saveVaultTimeoutAction(previousValue, newValue);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    const initialValues = {
      vaultTimeout: timeout,
      vaultTimeoutAction: await firstValueFrom(
        this.vaultTimeoutSettingsService.getVaultTimeoutActionByUserId$(activeAccount.id),
      ),
      pin: pinStatus !== "DISABLED",
      biometric: await this.vaultTimeoutSettingsService.isBiometricLockSet(),
      enableAutoBiometricsPrompt: await firstValueFrom(
        this.biometricStateService.promptAutomatically$,
      ),
    };
    this.form.patchValue(initialValues); // Emit event to initialize `pairwise` operator

    this.supportsBiometric = await this.platformUtilsService.supportsBiometric();
    this.showChangeMasterPass = await this.userVerificationService.hasMasterPassword();

    this.form.controls.pin.valueChanges
      .pipe(
        concatMap(async (value) => {
          await this.updatePin(value);
          this.refreshTimeoutSettings$.next();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this.form.controls.biometric.valueChanges
      .pipe(
        distinctUntilChanged(),
        concatMap(async (enabled) => {
          await this.updateBiometric(enabled);
          if (enabled) {
            this.form.controls.enableAutoBiometricsPrompt.enable();
          } else {
            this.form.controls.enableAutoBiometricsPrompt.disable();
          }
          this.refreshTimeoutSettings$.next();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this.refreshTimeoutSettings$
      .pipe(
        switchMap(() =>
          combineLatest([
            this.vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
            this.vaultTimeoutSettingsService.getVaultTimeoutActionByUserId$(activeAccount.id),
          ]),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(([availableActions, action]) => {
        this.availableVaultTimeoutActions = availableActions;
        this.form.controls.vaultTimeoutAction.setValue(action, { emitEvent: false });
        // NOTE: The UI doesn't properly update without detect changes.
        // I've even tried using an async pipe, but it still doesn't work. I'm not sure why.
        // Using an async pipe means that we can't call `detectChanges` AFTER the data has change
        // meaning that we are forced to use regular class variables instead of observables.
        this.changeDetectorRef.detectChanges();
      });

    this.refreshTimeoutSettings$
      .pipe(
        switchMap(() =>
          combineLatest([
            this.vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
            maximumVaultTimeoutPolicy,
          ]),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(([availableActions, policy]) => {
        if (policy?.data?.action || availableActions.length <= 1) {
          this.form.controls.vaultTimeoutAction.disable({ emitEvent: false });
        } else {
          this.form.controls.vaultTimeoutAction.enable({ emitEvent: false });
        }
      });
  }

  async saveVaultTimeout(previousValue: number, newValue: number) {
    if (newValue == null) {
      const confirmed = await this.dialogService.openSimpleDialog({
        title: { key: "warning" },
        content: { key: "neverLockWarning" },
        type: "warning",
      });

      if (!confirmed) {
        this.form.controls.vaultTimeout.setValue(previousValue, { emitEvent: false });
        return;
      }
    }

    // The minTimeoutError does not apply to browser because it supports Immediately
    // So only check for the policyError
    if (this.form.controls.vaultTimeout.hasError("policyError")) {
      this.platformUtilsService.showToast(
        "error",
        null,
        this.i18nService.t("vaultTimeoutTooLarge"),
      );
      return;
    }

    const activeAccount = await firstValueFrom(this.accountService.activeAccount$);

    await this.vaultTimeoutSettingsService.setVaultTimeoutOptions(
      activeAccount.id,
      newValue,
      await firstValueFrom(
        this.vaultTimeoutSettingsService.getVaultTimeoutActionByUserId$(activeAccount.id),
      ),
    );
    if (newValue == null) {
      this.messagingService.send("bgReseedStorage");
    }
  }

  async saveVaultTimeoutAction(previousValue: VaultTimeoutAction, newValue: VaultTimeoutAction) {
    if (newValue === VaultTimeoutAction.LogOut) {
      const confirmed = await this.dialogService.openSimpleDialog({
        title: { key: "vaultTimeoutLogOutConfirmationTitle" },
        content: { key: "vaultTimeoutLogOutConfirmation" },
        type: "warning",
      });

      if (!confirmed) {
        this.form.controls.vaultTimeoutAction.setValue(previousValue, {
          emitEvent: false,
        });
        return;
      }
    }

    if (this.form.controls.vaultTimeout.hasError("policyError")) {
      this.platformUtilsService.showToast(
        "error",
        null,
        this.i18nService.t("vaultTimeoutTooLarge"),
      );
      return;
    }

    const activeAccount = await firstValueFrom(this.accountService.activeAccount$);

    await this.vaultTimeoutSettingsService.setVaultTimeoutOptions(
      activeAccount.id,
      this.form.value.vaultTimeout,
      newValue,
    );
    this.refreshTimeoutSettings$.next();
  }

  async updatePin(value: boolean) {
    if (value) {
      const dialogRef = SetPinComponent.open(this.dialogService);

      if (dialogRef == null) {
        this.form.controls.pin.setValue(false, { emitEvent: false });
        return;
      }

      const userHasPinSet = await firstValueFrom(dialogRef.closed);
      this.form.controls.pin.setValue(userHasPinSet, { emitEvent: false });
    } else {
      await this.vaultTimeoutSettingsService.clear();
    }
  }

  async updateBiometric(enabled: boolean) {
    if (enabled && this.supportsBiometric) {
      let granted;
      try {
        granted = await BrowserApi.requestPermission({ permissions: ["nativeMessaging"] });
      } catch (e) {
        // eslint-disable-next-line
        console.error(e);

        if (this.platformUtilsService.isFirefox() && BrowserPopupUtils.inSidebar(window)) {
          await this.dialogService.openSimpleDialog({
            title: { key: "nativeMessaginPermissionSidebarTitle" },
            content: { key: "nativeMessaginPermissionSidebarDesc" },
            acceptButtonText: { key: "ok" },
            cancelButtonText: null,
            type: "info",
          });

          this.form.controls.biometric.setValue(false);
          return;
        }
      }

      if (!granted) {
        await this.dialogService.openSimpleDialog({
          title: { key: "nativeMessaginPermissionErrorTitle" },
          content: { key: "nativeMessaginPermissionErrorDesc" },
          acceptButtonText: { key: "ok" },
          cancelButtonText: null,
          type: "danger",
        });

        this.form.controls.biometric.setValue(false);
        return;
      }

      const awaitDesktopDialogRef = AwaitDesktopDialogComponent.open(this.dialogService);
      const awaitDesktopDialogClosed = firstValueFrom(awaitDesktopDialogRef.closed);

      await this.cryptoService.refreshAdditionalKeys();

      await Promise.race([
        awaitDesktopDialogClosed.then(async (result) => {
          if (result !== true) {
            this.form.controls.biometric.setValue(false);
          }
        }),
        this.platformUtilsService
          .authenticateBiometric()
          .then((result) => {
            this.form.controls.biometric.setValue(result);
            if (!result) {
              this.platformUtilsService.showToast(
                "error",
                this.i18nService.t("errorEnableBiometricTitle"),
                this.i18nService.t("errorEnableBiometricDesc"),
              );
            }
          })
          .catch((e) => {
            // Handle connection errors
            this.form.controls.biometric.setValue(false);

            const error = BiometricErrors[e.message as BiometricErrorTypes];

            // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.dialogService.openSimpleDialog({
              title: { key: error.title },
              content: { key: error.description },
              acceptButtonText: { key: "ok" },
              cancelButtonText: null,
              type: "danger",
            });
          })
          .finally(() => {
            awaitDesktopDialogRef.close(true);
          }),
      ]);
    } else {
      await this.biometricStateService.setBiometricUnlockEnabled(false);
      await this.biometricStateService.setFingerprintValidated(false);
    }
  }

  async updateAutoBiometricsPrompt() {
    await this.biometricStateService.setPromptAutomatically(
      this.form.value.enableAutoBiometricsPrompt,
    );
  }

  async lock() {
    await this.vaultTimeoutService.lock();
  }

  async logOut() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "logOut" },
      content: { key: "logOutConfirmation" },
      type: "info",
    });

    if (confirmed) {
      this.messagingService.send("logout");
    }
  }

  async changePassword() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "continueToWebApp" },
      content: { key: "changeMasterPasswordOnWebConfirmation" },
      type: "info",
      acceptButtonText: { key: "continue" },
    });
    if (confirmed) {
      const env = await firstValueFrom(this.environmentService.environment$);
      await BrowserApi.createNewTab(env.getWebVaultUrl());
    }
  }

  async twoStep() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "twoStepLogin" },
      content: { key: "twoStepLoginConfirmation" },
      type: "info",
    });
    if (confirmed) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserApi.createNewTab("https://bitwarden.com/help/setup-two-step-login/");
    }
  }

  async share() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "learnOrg" },
      content: { key: "learnOrgConfirmation" },
      type: "info",
    });
    if (confirmed) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserApi.createNewTab("https://bitwarden.com/help/about-organizations/");
    }
  }

  async webVault() {
    const env = await firstValueFrom(this.environmentService.environment$);
    const url = env.getWebVaultUrl();
    await BrowserApi.createNewTab(url);
  }

  async import() {
    await this.router.navigate(["/import"]);
    if (await BrowserApi.isPopupOpen()) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserPopupUtils.openCurrentPagePopout(window);
    }
  }

  export() {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/export"]);
  }

  about() {
    this.dialogService.open(AboutComponent);
  }

  async fingerprint() {
    const fingerprint = await this.cryptoService.getFingerprint(
      await this.stateService.getUserId(),
    );

    const dialogRef = FingerprintDialogComponent.open(this.dialogService, {
      fingerprint,
    });

    return firstValueFrom(dialogRef.closed);
  }

  rate() {
    const deviceType = this.platformUtilsService.getDevice();
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    BrowserApi.createNewTab((RateUrls as any)[deviceType]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
