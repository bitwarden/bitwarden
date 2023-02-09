import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { canAccessBillingTab } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";

// TODO refine elsint rule for src/**/* and/or figure out why this can't work as-is
// eslint-disable-next-line no-restricted-imports
import { WebPlatformUtilsService } from "../../app/core/web-platform-utils.service";
import { OrganizationPermissionsGuard } from "../../app/organizations/guards/org-permissions.guard";
import { PaymentMethodComponent } from "../../billing/settings/payment-method.component";

import { OrgBillingHistoryViewComponent } from "./organization-billing-history-view.component";
import { OrganizationBillingTabComponent } from "./organization-billing-tab.component";
import { OrganizationSubscriptionCloudComponent } from "./organization-subscription-cloud.component";
import { OrganizationSubscriptionSelfhostComponent } from "./organization-subscription-selfhost.component";

const routes: Routes = [
  {
    path: "",
    component: OrganizationBillingTabComponent,
    canActivate: [OrganizationPermissionsGuard],
    data: { organizationPermissions: canAccessBillingTab },
    children: [
      { path: "", pathMatch: "full", redirectTo: "subscription" },
      {
        path: "subscription",
        component: WebPlatformUtilsService.isSelfHost()
          ? OrganizationSubscriptionSelfhostComponent
          : OrganizationSubscriptionCloudComponent,
        data: { titleId: "subscription" },
      },
      {
        path: "payment-method",
        component: PaymentMethodComponent,
        data: {
          titleId: "paymentMethod",
        },
      },
      {
        path: "history",
        component: OrgBillingHistoryViewComponent,
        data: {
          titleId: "billingHistory",
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationBillingRoutingModule {}
