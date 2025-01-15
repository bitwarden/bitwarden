import { DialogModule } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Inject, OnDestroy, OnInit, Output } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import { WINDOW } from "@bitwarden/angular/services/injection-tokens";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { WebAuthnIFrame } from "@bitwarden/common/auth/webauthn-iframe";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  ButtonModule,
  LinkModule,
  TypographyModule,
  FormFieldModule,
  AsyncActionsModule,
  ToastService,
} from "@bitwarden/components";

import { TwoFactorAuthWebAuthnComponentService } from "./two-factor-auth-webauthn-component.service";

@Component({
  standalone: true,
  selector: "app-two-factor-auth-webauthn",
  templateUrl: "two-factor-auth-webauthn.component.html",
  imports: [
    CommonModule,
    JslibModule,
    DialogModule,
    ButtonModule,
    LinkModule,
    TypographyModule,
    ReactiveFormsModule,
    FormFieldModule,
    AsyncActionsModule,
    FormsModule,
  ],
  providers: [I18nPipe],
})
export class TwoFactorAuthWebAuthnComponent implements OnInit, OnDestroy {
  @Output() token = new EventEmitter<string>();

  webAuthnReady = false;
  webAuthnNewTab = false;
  webAuthnSupported = false;
  webAuthnIframe: WebAuthnIFrame | undefined = undefined;

  constructor(
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService,
    @Inject(WINDOW) protected win: Window,
    protected environmentService: EnvironmentService,
    protected twoFactorService: TwoFactorService,
    protected route: ActivatedRoute,
    private toastService: ToastService,
    private twoFactorAuthWebAuthnComponentService: TwoFactorAuthWebAuthnComponentService,
    private logService: LogService,
  ) {
    this.webAuthnSupported = this.platformUtilsService.supportsWebAuthn(win);
    this.webAuthnNewTab = this.twoFactorAuthWebAuthnComponentService.shouldOpenWebAuthnInNewTab();
  }

  async ngOnInit(): Promise<void> {
    if (this.route.snapshot.paramMap.has("webAuthnResponse")) {
      const webAuthnResponse = this.route.snapshot.paramMap.get("webAuthnResponse");

      if (webAuthnResponse != null) {
        this.token.emit(webAuthnResponse);
      }
    }

    if (this.win != null && this.webAuthnSupported) {
      const env = await firstValueFrom(this.environmentService.environment$);
      const webVaultUrl = env.getWebVaultUrl();
      this.webAuthnIframe = new WebAuthnIFrame(
        this.win,
        webVaultUrl,
        this.webAuthnNewTab,
        this.platformUtilsService,
        this.i18nService,
        (token: string) => {
          this.token.emit(token);
        },
        (error: string) => {
          this.toastService.showToast({
            variant: "error",
            title: this.i18nService.t("errorOccurred"),
            message: this.i18nService.t("webauthnCancelOrTimeout"),
          });
        },
        (info: string) => {
          if (info === "ready") {
            this.webAuthnReady = true;
          }
        },
      );

      if (!this.webAuthnNewTab) {
        setTimeout(async () => {
          await this.authWebAuthn();
        }, 500);
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanupWebAuthnIframe();
  }

  async authWebAuthn() {
    const providers = await this.twoFactorService.getProviders();

    if (providers == null) {
      this.logService.error("No 2FA providers found. Unable to authenticate with WebAuthn.");
      return;
    }

    const providerData = providers?.get(TwoFactorProviderType.WebAuthn);

    if (!this.webAuthnSupported || this.webAuthnIframe == null) {
      return;
    }

    this.webAuthnIframe.init(providerData);
  }

  private cleanupWebAuthnIframe() {
    if (this.webAuthnIframe != null) {
      this.webAuthnIframe.stop();
      this.webAuthnIframe.cleanup();
    }
  }
}
