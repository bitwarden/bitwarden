import { Component, Input, OnInit } from "@angular/core";

import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { Utils } from "@bitwarden/common/platform/misc/utils";

@Component({
  selector: "environment-selector",
  templateUrl: "environment-selector.component.html",
})
export class EnvironmentSelectorComponent implements OnInit {
  constructor(private configService: ConfigServiceAbstraction) {}
  @Input() hasFlags: boolean;
  isEuServer: boolean;
  isUsServer: boolean;
  showRegionSelector: boolean;
  euServerFlagEnabled: boolean;
  selectedRegionImageName: string;

  async ngOnInit() {
    this.euServerFlagEnabled = await this.configService.getFeatureFlagBool(
      FeatureFlag.DisplayEuEnvironmentFlag
    );
    const domain = Utils.getDomain(window.location.href);
    this.isEuServer = domain.includes("bitwarden.eu");
    this.isUsServer = domain.includes("bitwarden.com") || domain.includes("bitwarden.pw");
    this.selectedRegionImageName = this.getRegionImage();

    this.showRegionSelector = this.isEuServer || this.isUsServer;
  }

  getRegionImage(): string {
    if (this.isEuServer) {
      return "eu_flag";
    } else if (this.isUsServer) {
      return "us_flag";
    }
  }
}
