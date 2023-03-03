import { Component, Input } from "@angular/core";

import { Icon } from "@bitwarden/components";

import { ReportVariant } from "../models/report-variant";

@Component({
  selector: "app-report-card",
  templateUrl: "report-card.component.html",
})
export class ReportCardComponent {
  @Input() title: string;
  @Input() description: string;
  @Input() icon: Icon;
  @Input() variant: ReportVariant;

  protected get disabled() {
    return this.variant != ReportVariant.Enabled;
  }

  protected get requiresPremium() {
    return this.variant == ReportVariant.RequiresPremium;
  }
}
