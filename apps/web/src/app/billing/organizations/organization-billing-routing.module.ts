import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { canAccessBillingTab } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";

import { organizationPermissionsGuard } from "../../admin-console/organizations/guards/org-permissions.guard";
import { organizationIsUnmanaged } from "../../billing/guards/organization-is-unmanaged.guard";
import { WebPlatformUtilsService } from "../../core/web-platform-utils.service";
import { PaymentMethodComponent } from "../shared";

import { OrgBillingHistoryViewComponent } from "./organization-billing-history-view.component";
import { OrganizationSubscriptionCloudComponent } from "./organization-subscription-cloud.component";
import { OrganizationSubscriptionSelfhostComponent } from "./organization-subscription-selfhost.component";

const routes: Routes = [
  {
    path: "",
    canActivate: [organizationPermissionsGuard(canAccessBillingTab)],
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
        canActivate: [
          organizationPermissionsGuard((org) => org.canEditPaymentMethods),
          organizationIsUnmanaged,
        ],
        data: {
          titleId: "paymentMethod",
        },
      },
      {
        path: "history",
        component: OrgBillingHistoryViewComponent,
        canActivate: [
          organizationPermissionsGuard((org) => org.canViewBillingHistory),
          organizationIsUnmanaged,
        ],
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
