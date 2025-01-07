import { Component } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";

import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ToastService } from "@bitwarden/components";

import { BaseAcceptComponent } from "../../common/base.accept.component";

import { AcceptOrganizationInviteService } from "./accept-organization.service";
import { OrganizationInvite } from "./organization-invite";

@Component({
  templateUrl: "accept-organization.component.html",
})
export class AcceptOrganizationComponent extends BaseAcceptComponent {
  orgName$ = this.acceptOrganizationInviteService.orgName$;
  protected requiredParameters: string[] = ["organizationId", "organizationUserId", "token"];

  constructor(
    router: Router,
    i18nService: I18nService,
    route: ActivatedRoute,
    authService: AuthService,
    toastService: ToastService,
    private acceptOrganizationInviteService: AcceptOrganizationInviteService,
    private logService: LogService,
  ) {
    super(router, i18nService, route, authService, toastService);
  }

  async authedHandler(qParams: Params): Promise<void> {
    const invite = OrganizationInvite.fromParams(qParams);
    const success = await this.acceptOrganizationInviteService.validateAndAcceptInvite(invite);

    if (!success) {
      return;
    }

    this.toastService.showToast({
      variant: "success",
      title: this.i18nService.t("inviteAccepted"),
      message: invite.initOrganization
        ? this.i18nService.t("inviteInitAcceptedDesc")
        : this.i18nService.t("inviteAcceptedDesc"),
    });

    await this.router.navigate(["/vault"]);
  }

  async unauthedHandler(qParams: Params): Promise<void> {
    const invite = OrganizationInvite.fromParams(qParams);

    await this.acceptOrganizationInviteService.setOrganizationInvitation(invite);
    await this.navigateInviteAcceptance(invite);
  }

  /**
   * In certain scenarios, we want to accelerate the user through the accept org invite process
   * For example, if the user has a BW account already, we want them to be taken to login instead of creation.
   */
  private async navigateInviteAcceptance(invite: OrganizationInvite): Promise<void> {
    // if user exists, send user to login
    if (invite.orgUserHasExistingUser) {
      await this.router.navigate(["/login"], {
        queryParams: { email: invite.email },
      });
      return;
    }

    if (invite.orgSsoIdentifier) {
      // We only send sso org identifier if the org has SSO enabled and the SSO policy required.
      // Will JIT provision the user.
      // Note: If the organization has Admin Recovery enabled, the user will be accepted into the org
      // upon enrollment. The user should not be returned here.
      await this.router.navigate(["/sso"], {
        queryParams: { email: invite.email, identifier: invite.orgSsoIdentifier },
      });
      return;
    }

    // if SSO is disabled OR if sso is enabled but the SSO login required policy is not enabled
    // then send user to create account

    await this.router.navigate(["/signup"], {
      queryParams: {
        email: invite.email,
      },
    });
    return;
  }
}
