import { NgModule } from "@angular/core";

import { LayoutComponent as BitLayoutComponent, NavigationModule } from "@bitwarden/components";
import { OrgSwitcherComponent } from "@bitwarden/web-vault/app/layouts/org-switcher/org-switcher.component";
import { SharedModule } from "@bitwarden/web-vault/app/shared/shared.module";

import { LayoutComponent } from "./layout.component";
import { NavigationComponent } from "./navigation.component";

@NgModule({
  imports: [SharedModule, NavigationModule, BitLayoutComponent, OrgSwitcherComponent],
  declarations: [LayoutComponent, NavigationComponent],
})
export class LayoutModule {}
