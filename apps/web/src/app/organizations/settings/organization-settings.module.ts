import { NgModule } from "@angular/core";

import { PoliciesModule } from "../../admin-console/organizations/policies";
import { LooseComponentsModule, SharedModule } from "../../shared";

import { AccountComponent } from "./account.component";
import { DeleteOrganizationComponent } from "./delete-organization.component";
import { OrganizationSettingsRoutingModule } from "./organization-settings-routing.module";
import { SettingsComponent } from "./settings.component";
import { TwoFactorSetupComponent } from "./two-factor-setup.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule, PoliciesModule, OrganizationSettingsRoutingModule],
  declarations: [
    SettingsComponent,
    AccountComponent,
    DeleteOrganizationComponent,
    TwoFactorSetupComponent,
  ],
})
export class OrganizationSettingsModule {}
