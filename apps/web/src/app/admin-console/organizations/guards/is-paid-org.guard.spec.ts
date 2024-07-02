import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { MockProxy, any, mock } from "jest-mock-extended";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { OrganizationUserType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { DialogService } from "@bitwarden/components";

import { isPaidOrgGuard } from "./is-paid-org.guard";

@Component({
  template: "<h1>This is the home screen!</h1>",
})
export class HomescreenComponent {}

@Component({
  template: "<h1>This component can only be accessed by a paid organization!</h1>",
})
export class PaidOrganizationOnlyComponent {}

@Component({
  template: "<h1>This is the organization upgrade screen!</h1>",
})
export class OrganizationUpgradeScreen {}

const orgFactory = (props: Partial<Organization> = {}) =>
  Object.assign(
    new Organization(),
    {
      id: "myOrgId",
      enabled: true,
      type: OrganizationUserType.Admin,
    },
    props,
  );

describe("Is Paid Org Guard", () => {
  let organizationService: MockProxy<OrganizationService>;
  let dialogService: MockProxy<DialogService>;
  let routerHarness: RouterTestingHarness;

  beforeEach(async () => {
    organizationService = mock<OrganizationService>();
    dialogService = mock<DialogService>();

    TestBed.configureTestingModule({
      providers: [
        { provide: OrganizationService, useValue: organizationService },
        { provide: DialogService, useValue: dialogService },
        provideRouter([
          {
            path: "",
            component: HomescreenComponent,
          },
          {
            path: "organizations/:organizationId/paidOrganizationsOnly",
            component: PaidOrganizationOnlyComponent,
            canActivate: [isPaidOrgGuard()],
          },
          {
            path: "organizations/:organizationId/billing/subscription",
            component: OrganizationUpgradeScreen,
          },
        ]),
      ],
    });

    routerHarness = await RouterTestingHarness.create();
  });

  it("redirects to `/` if the organization id provided is not found", async () => {
    const org = orgFactory();
    organizationService.get.calledWith(org.id).mockResolvedValue(null);
    await routerHarness.navigateByUrl(`organizations/${org.id}/paidOrganizationsOnly`);
    expect(routerHarness.routeNativeElement?.querySelector("h1")?.textContent?.trim() ?? "").toBe(
      "This is the home screen!",
    );
  });

  it("shows a dialog to users of a free organization and does not proceed with navigation", async () => {
    // `useTotp` is the current indicator of a free org, it is the baseline
    // feature offered above the free organization level.
    const org = orgFactory({ type: OrganizationUserType.User, useTotp: false });
    organizationService.get.calledWith(org.id).mockResolvedValue(org);
    await routerHarness.navigateByUrl(`organizations/${org.id}/paidOrganizationsOnly`);
    expect(dialogService.openSimpleDialog).toHaveBeenCalled();
    expect(
      routerHarness.routeNativeElement?.querySelector("h1")?.textContent?.trim() ?? "",
    ).not.toBe("This component can only be accessed by a paid organization!");
  });

  it("redirects users with billing access to the billing screen to upgrade", async () => {
    // `useTotp` is the current indicator of a free org, it is the baseline
    // feature offered above the free organization level.
    const org = orgFactory({ type: OrganizationUserType.Owner, useTotp: false });
    organizationService.get.calledWith(org.id).mockResolvedValue(org);
    dialogService.openSimpleDialog.calledWith(any()).mockResolvedValue(true);
    await routerHarness.navigateByUrl(`organizations/${org.id}/paidOrganizationsOnly`);
    expect(routerHarness.routeNativeElement?.querySelector("h1")?.textContent?.trim() ?? "").toBe(
      "This is the organization upgrade screen!",
    );
  });

  it("proceeds with navigation if the organization in question is a paid organization", async () => {
    const org = orgFactory({ useTotp: true });
    organizationService.get.calledWith(org.id).mockResolvedValue(org);
    await routerHarness.navigateByUrl(`organizations/${org.id}/paidOrganizationsOnly`);
    expect(routerHarness.routeNativeElement?.querySelector("h1")?.textContent?.trim() ?? "").toBe(
      "This component can only be accessed by a paid organization!",
    );
  });
});
