import { importProvidersFrom, Component } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import {
  Meta,
  StoryObj,
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
} from "@storybook/angular";
import { of } from "rxjs";

import { AnonLayoutWrapperDataService, LockIcon } from "@bitwarden/auth/angular";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AvatarService } from "@bitwarden/common/auth/abstractions/avatar.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { ClientType } from "@bitwarden/common/enums";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import {
  EnvironmentService,
  Environment,
} from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { ThemeType } from "@bitwarden/common/platform/enums";
import { ThemeStateService } from "@bitwarden/common/platform/theming/theme-state.service";
import { UserId } from "@bitwarden/common/types/guid";
import { ButtonModule } from "@bitwarden/components";

import { PreloadedEnglishI18nModule } from "../../../../../../apps/web/src/app/core/tests";
import { RegistrationCheckEmailIcon } from "../../../../../../libs/auth/src/angular/icons/registration-check-email.icon";

import { ExtensionAnonLayoutWrapperDataService } from "./extension-anon-layout-wrapper-data.service";
import {
  ExtensionAnonLayoutWrapperComponent,
  ExtensionAnonLayoutWrapperData,
} from "./extension-anon-layout-wrapper.component";

export default {
  title: "Auth/Extension Anon Layout Wrapper",
  component: ExtensionAnonLayoutWrapperComponent,
} as Meta;

const decorators = (options: {
  components: any[];
  routes: Routes;
  applicationVersion?: string;
  clientType?: ClientType;
  hostName?: string;
  themeType?: ThemeType;
}) => {
  return [
    componentWrapperDecorator(
      /**
       * Applying a CSS transform makes a `position: fixed` element act like it is `position: relative`
       * https://github.com/storybookjs/storybook/issues/8011#issue-490251969
       */
      (story) => {
        return /* HTML */ `<div class="tw-scale-100 ">${story}</div>`;
      },
      ({ globals }) => {
        /**
         * avoid a bug with the way that we render the same component twice in the same iframe and how
         * that interacts with the router-outlet
         */
        const themeOverride = globals["theme"] === "both" ? "light" : globals["theme"];
        return { theme: themeOverride };
      },
    ),
    moduleMetadata({
      declarations: options.components,
      imports: [RouterModule, ButtonModule],
      providers: [
        {
          provide: AnonLayoutWrapperDataService,
          useClass: ExtensionAnonLayoutWrapperDataService,
        },
        {
          provide: AccountService,
          useValue: {
            activeAccount$: of({
              id: "test-user-id" as UserId,
              name: "Test User 1",
              email: "test@email.com",
              emailVerified: true,
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            activeAccountStatus$: of(AuthenticationStatus.Unlocked),
          },
        },
        {
          provide: AvatarService,
          useValue: {
            avatarColor$: of("#ab134a"),
          } as Partial<AvatarService>,
        },
        {
          provide: ConfigService,
          useValue: {
            getFeatureFlag: () => true,
          },
        },
        {
          provide: EnvironmentService,
          useValue: {
            environment$: of({
              getHostname: () => options.hostName || "storybook.bitwarden.com",
            } as Partial<Environment>),
          } as Partial<EnvironmentService>,
        },
        {
          provide: PlatformUtilsService,
          useValue: {
            getApplicationVersion: () =>
              Promise.resolve(options.applicationVersion || "FAKE_APP_VERSION"),
            getClientType: () => options.clientType || ClientType.Web,
          } as Partial<PlatformUtilsService>,
        },
        {
          provide: ThemeStateService,
          useValue: {
            selectedTheme$: of(options.themeType || ThemeType.Light),
          } as Partial<ThemeStateService>,
        },
      ],
    }),
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot(options.routes)),
        importProvidersFrom(PreloadedEnglishI18nModule),
      ],
    }),
  ];
};

type Story = StoryObj<ExtensionAnonLayoutWrapperComponent>;

// Default Example

@Component({
  selector: "bit-default-primary-outlet-example-component",
  template: "<p>Primary Outlet Example: <br> your primary component goes here</p>",
})
class DefaultPrimaryOutletExampleComponent {}

@Component({
  selector: "bit-default-secondary-outlet-example-component",
  template: "<p>Secondary Outlet Example: <br> your secondary component goes here</p>",
})
class DefaultSecondaryOutletExampleComponent {}

@Component({
  selector: "bit-default-env-selector-outlet-example-component",
  template: "<p>Env Selector Outlet Example: <br> your env selector component goes here</p>",
})
class DefaultEnvSelectorOutletExampleComponent {}

export const DefaultContentExample: Story = {
  render: (args) => ({
    props: args,
    template: "<router-outlet></router-outlet>",
  }),
  decorators: decorators({
    components: [
      DefaultPrimaryOutletExampleComponent,
      DefaultSecondaryOutletExampleComponent,
      DefaultEnvSelectorOutletExampleComponent,
    ],
    routes: [
      {
        path: "**",
        redirectTo: "default-example",
        pathMatch: "full",
      },
      {
        path: "",
        component: ExtensionAnonLayoutWrapperComponent,
        children: [
          {
            path: "default-example",
            data: {},
            children: [
              {
                path: "",
                component: DefaultPrimaryOutletExampleComponent,
              },
              {
                path: "",
                component: DefaultSecondaryOutletExampleComponent,
                outlet: "secondary",
              },
              {
                path: "",
                component: DefaultEnvSelectorOutletExampleComponent,
                outlet: "environment-selector",
              },
            ],
          },
        ],
      },
    ],
  }),
};

// Dynamic Content Example
const initialData: ExtensionAnonLayoutWrapperData = {
  pageTitle: "setAStrongPassword",
  pageSubtitle: "finishCreatingYourAccountBySettingAPassword",
  pageIcon: LockIcon,
  showAcctSwitcher: true,
  showBackButton: true,
  showLogo: true,
};

const changedData: ExtensionAnonLayoutWrapperData = {
  pageTitle: "enterpriseSingleSignOn",
  pageSubtitle: "checkYourEmail",
  pageIcon: RegistrationCheckEmailIcon,
  showAcctSwitcher: true,
  showBackButton: true,
  showLogo: true,
};

@Component({
  selector: "bit-dynamic-content-example-component",
  template: `
    <button type="button" bitButton buttonType="primary" (click)="toggleData()">Toggle Data</button>
  `,
})
export class DynamicContentExampleComponent {
  initialData = true;

  constructor(private extensionAnonLayoutWrapperDataService: AnonLayoutWrapperDataService) {}

  toggleData() {
    if (this.initialData) {
      this.extensionAnonLayoutWrapperDataService.setAnonLayoutWrapperData(changedData);
    } else {
      this.extensionAnonLayoutWrapperDataService.setAnonLayoutWrapperData(initialData);
    }

    this.initialData = !this.initialData;
  }
}

export const DynamicContentExample: Story = {
  render: (args) => ({
    props: args,
    template: "<router-outlet></router-outlet>",
  }),
  decorators: decorators({
    components: [DynamicContentExampleComponent],
    routes: [
      {
        path: "**",
        redirectTo: "dynamic-content-example",
        pathMatch: "full",
      },
      {
        path: "",
        component: ExtensionAnonLayoutWrapperComponent,
        children: [
          {
            path: "dynamic-content-example",
            data: initialData,
            children: [
              {
                path: "",
                component: DynamicContentExampleComponent,
              },
            ],
          },
        ],
      },
    ],
  }),
};
