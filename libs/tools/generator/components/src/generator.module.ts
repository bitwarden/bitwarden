import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { safeProvider } from "@bitwarden/angular/platform/utils/safe-provider";
import { SafeInjectionToken } from "@bitwarden/angular/services/injection-tokens";
import { JslibServicesModule } from "@bitwarden/angular/services/jslib-services.module";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import {
  CardComponent,
  ColorPasswordModule,
  CheckboxModule,
  FormFieldModule,
  IconButtonModule,
  InputModule,
  ItemModule,
  SectionComponent,
  SectionHeaderComponent,
  SelectModule,
  ToggleGroupModule,
} from "@bitwarden/components";
import {
  createRandomizer,
  CredentialGeneratorService,
  Randomizer,
} from "@bitwarden/generator-core";

import { CatchallSettingsComponent } from "./catchall-settings.component";
import { CredentialGeneratorComponent } from "./credential-generator.component";
import { PassphraseSettingsComponent } from "./passphrase-settings.component";
import { PasswordGeneratorComponent } from "./password-generator.component";
import { PasswordSettingsComponent } from "./password-settings.component";
import { SubaddressSettingsComponent } from "./subaddress-settings.component";
import { UsernameGeneratorComponent } from "./username-generator.component";
import { UsernameSettingsComponent } from "./username-settings.component";

const RANDOMIZER = new SafeInjectionToken<Randomizer>("Randomizer");

/** Shared module containing generator component dependencies */
@NgModule({
  imports: [
    CardComponent,
    ColorPasswordModule,
    CheckboxModule,
    CommonModule,
    FormFieldModule,
    IconButtonModule,
    InputModule,
    ItemModule,
    JslibModule,
    JslibServicesModule,
    ReactiveFormsModule,
    SectionComponent,
    SectionHeaderComponent,
    SelectModule,
    ToggleGroupModule,
  ],
  providers: [
    safeProvider({
      provide: RANDOMIZER,
      useFactory: createRandomizer,
      deps: [CryptoService],
    }),
    safeProvider({
      provide: CredentialGeneratorService,
      useClass: CredentialGeneratorService,
      deps: [RANDOMIZER, StateProvider, PolicyService],
    }),
  ],
  declarations: [
    CatchallSettingsComponent,
    CredentialGeneratorComponent,
    SubaddressSettingsComponent,
    UsernameSettingsComponent,
    PasswordGeneratorComponent,
    PasswordSettingsComponent,
    PassphraseSettingsComponent,
    UsernameGeneratorComponent,
  ],
  exports: [CredentialGeneratorComponent, PasswordGeneratorComponent, UsernameGeneratorComponent],
})
export class GeneratorModule {
  constructor() {}
}
