import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom, Observable } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { Account, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ClientType } from "@bitwarden/common/enums";
import {
  Environment,
  EnvironmentService,
} from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { UserId } from "@bitwarden/common/types/guid";
import { ButtonModule, LinkModule, TypographyModule } from "@bitwarden/components";

import { NewDeviceVerificationNoticeService } from "../../services/new-device-verification-notice.service";

@Component({
  standalone: true,
  selector: "app-new-device-verification-notice-page-two",
  templateUrl: "./new-device-verification-notice-page-two.component.html",
  imports: [CommonModule, JslibModule, TypographyModule, ButtonModule, LinkModule],
})
export class NewDeviceVerificationNoticePageTwoComponent implements OnInit {
  protected isWeb: boolean;
  protected isDesktop: boolean;
  readonly currentAcct$: Observable<Account | null> = this.accountService.activeAccount$;
  private currentUserId: UserId | null = null;
  private env$: Observable<Environment> = this.environmentService.environment$;

  constructor(
    private newDeviceVerificationNoticeService: NewDeviceVerificationNoticeService,
    private router: Router,
    private accountService: AccountService,
    private platformUtilsService: PlatformUtilsService,
    private environmentService: EnvironmentService,
  ) {
    this.isWeb = this.platformUtilsService.getClientType() === ClientType.Web;
    this.isDesktop = this.platformUtilsService.getClientType() === ClientType.Desktop;
  }

  async ngOnInit() {
    const currentAcct = await firstValueFrom(this.currentAcct$);
    if (!currentAcct) {
      return;
    }
    this.currentUserId = currentAcct.id;
  }

  async navigateToTwoStepLogin() {
    const env = await firstValueFrom(this.env$);
    const url = env.getWebVaultUrl();

    if (this.isWeb) {
      await this.router.navigate(["/settings/security/two-factor"], {
        queryParams: { fromNewDeviceVerification: true },
      });
    } else {
      this.platformUtilsService.launchUri(
        url + "/#/settings/security/two-factor/?fromNewDeviceVerification=true",
      );
    }
  }

  async navigateToChangeAcctEmail() {
    const env = await firstValueFrom(this.env$);
    const url = env.getWebVaultUrl();
    if (this.isWeb) {
      await this.router.navigate(["/settings/account"], {
        queryParams: { fromNewDeviceVerification: true },
      });
    } else {
      this.platformUtilsService.launchUri(
        url + "/#/settings/account/?fromNewDeviceVerification=true",
      );
    }
  }

  async remindMeLaterSelect() {
    await this.newDeviceVerificationNoticeService.updateNewDeviceVerificationNoticeState(
      this.currentUserId,
      {
        last_dismissal: new Date(),
        permanent_dismissal: false,
      },
    );

    await this.router.navigate(["/vault"]);
  }
}
