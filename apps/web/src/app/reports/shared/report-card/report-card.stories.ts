import { importProvidersFrom } from "@angular/core";
import { RouterTestingModule } from "@angular/router/testing";
import { Meta, Story, applicationConfig, moduleMetadata } from "@storybook/angular";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { BadgeModule, IconModule } from "@bitwarden/components";

import { PreloadedEnglishI18nModule } from "../../../tests/preloaded-english-i18n.module";
import { PremiumBadgeComponent } from "../../../vault/components/premium-badge.component";
import { ReportVariant } from "../models/report-variant";

import { ReportCardComponent } from "./report-card.component";

export default {
  title: "Web/Reports/Card",
  component: ReportCardComponent,
  decorators: [
    moduleMetadata({
      imports: [JslibModule, BadgeModule, IconModule, RouterTestingModule],
      declarations: [PremiumBadgeComponent],
    }),
    applicationConfig({
      providers: [importProvidersFrom(PreloadedEnglishI18nModule)],
    }),
  ],
  args: {
    title: "Exposed Passwords",
    description:
      "Passwords exposed in a data breach are easy targets for attackers. Change these passwords to prevent potential break-ins.",
    icon: "reportExposedPasswords",
    variant: ReportVariant.Enabled,
  },
} as Meta;

const Template: Story<ReportCardComponent> = (args: ReportCardComponent) => ({
  props: args,
});

export const Enabled = Template.bind({});

export const RequiresPremium = Template.bind({});
RequiresPremium.args = {
  variant: ReportVariant.RequiresPremium,
};

export const RequiresUpgrade = Template.bind({});
RequiresUpgrade.args = {
  variant: ReportVariant.RequiresUpgrade,
};
