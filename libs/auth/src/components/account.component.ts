import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { AccountSwitcherService } from "../../../../apps/browser/src/auth/popup/services/account-switcher.service";
import { BrowserRouterService } from "../../../../apps/browser/src/platform/popup/services/browser-router.service";
import { AvatarModule } from "../../../components/src/avatar";

@Component({
  standalone: true,
  selector: "auth-account",
  templateUrl: "account.component.html",
  imports: [CommonModule, JslibModule, AvatarModule],
})
export class AccountComponent {
  // TODO: replace use of 'any'
  @Input() account: any;

  constructor(
    private accountSwitcherService: AccountSwitcherService,
    private router: Router,
    private routerService: BrowserRouterService,
    private i18nService: I18nService
  ) {}

  get specialAccountAddId() {
    return this.accountSwitcherService.SPECIAL_ADD_ACCOUNT_ID;
  }

  async selectAccount(id: string) {
    await this.accountSwitcherService.selectAccount(id);

    if (id === this.specialAccountAddId) {
      this.router.navigate(["home"]);
    } else {
      this.router.navigate([this.routerService.getPreviousUrl() ?? "/home"]);
    }
  }

  get status() {
    if (this.account.isSelected && this.account.status !== AuthenticationStatus.Locked) {
      return { text: this.i18nService.t("active"), icon: "bwi-check-circle" };
    }

    if (this.account.status === AuthenticationStatus.Unlocked) {
      return { text: this.i18nService.t("unlocked"), icon: "bwi-unlock" };
    }

    return { text: this.i18nService.t("locked"), icon: "bwi-lock" };
  }
}
