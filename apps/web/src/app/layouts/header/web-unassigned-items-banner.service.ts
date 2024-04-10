import { Injectable } from "@angular/core";
import { combineLatest, map } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import {
  GlobalStateProvider,
  KeyDefinition,
  UNASSIGNED_ITEMS_BANNER_DISK,
} from "@bitwarden/common/platform/state";

const HIDE_BANNER_KEY = new KeyDefinition<boolean>(UNASSIGNED_ITEMS_BANNER_DISK, "hideBanner", {
  deserializer: (b) => {
    if (b === null) {
      return false;
    }
    return b;
  },
});

/** Displays a banner that tells users how to move their unassigned items into a collection. */
@Injectable({ providedIn: "root" })
export class WebUnassignedItemsBannerService {
  private _hideBannerState = this.globalStateProvider.get(HIDE_BANNER_KEY);
  private _adminOrganizations = this.organizationService.organizations$.pipe(
    map((orgs) => orgs.filter((o) => o.isAdmin)),
  );

  showBanner$ = combineLatest([this._hideBannerState.state$, this._adminOrganizations]).pipe(
    map(([hideBanner, adminOrganizations]) => !hideBanner && adminOrganizations?.length > 1),
  );

  constructor(
    private globalStateProvider: GlobalStateProvider,
    private organizationService: OrganizationService,
  ) {}

  async hideBanner() {
    await this._hideBannerState.update(() => true);
  }
}
