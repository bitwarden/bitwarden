import { A11yModule } from "@angular/cdk/a11y";
import { DialogModule } from "@angular/cdk/dialog";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { LayoutModule } from "@angular/cdk/layout";
import { OverlayModule } from "@angular/cdk/overlay";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { EnvironmentSelectorComponent } from "@bitwarden/angular/auth/components/environment-selector.component";
import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ColorPasswordCountPipe } from "@bitwarden/angular/pipes/color-password-count.pipe";
import { ColorPasswordPipe } from "@bitwarden/angular/pipes/color-password.pipe";
import { UserVerificationDialogComponent } from "@bitwarden/auth/angular";
import { AvatarModule, ButtonModule, FormFieldModule, ToastModule } from "@bitwarden/components";

import { AccountComponent } from "../auth/popup/account-switching/account.component";
import { CurrentAccountComponent } from "../auth/popup/account-switching/current-account.component";
import { EnvironmentComponent } from "../auth/popup/environment.component";
import { ExtensionAnonLayoutWrapperComponent } from "../auth/popup/extension-anon-layout-wrapper/extension-anon-layout-wrapper.component";
import { HintComponent } from "../auth/popup/hint.component";
import { HomeComponent } from "../auth/popup/home.component";
import { LoginDecryptionOptionsComponentV1 } from "../auth/popup/login-decryption-options/login-decryption-options-v1.component";
import { LoginComponentV1 } from "../auth/popup/login-v1.component";
import { LoginViaAuthRequestComponentV1 } from "../auth/popup/login-via-auth-request-v1.component";
import { RegisterComponent } from "../auth/popup/register.component";
import { RemovePasswordComponent } from "../auth/popup/remove-password.component";
import { SetPasswordComponent } from "../auth/popup/set-password.component";
import { AccountSecurityComponent } from "../auth/popup/settings/account-security.component";
import { VaultTimeoutInputComponent } from "../auth/popup/settings/vault-timeout-input.component";
import { SsoComponentV1 } from "../auth/popup/sso-v1.component";
import { TwoFactorOptionsComponent } from "../auth/popup/two-factor-options.component";
import { TwoFactorComponent } from "../auth/popup/two-factor.component";
import { UpdateTempPasswordComponent } from "../auth/popup/update-temp-password.component";
import { Fido2CipherRowV1Component } from "../autofill/popup/fido2/fido2-cipher-row-v1.component";
import { Fido2CipherRowComponent } from "../autofill/popup/fido2/fido2-cipher-row.component";
import { Fido2UseBrowserLinkV1Component } from "../autofill/popup/fido2/fido2-use-browser-link-v1.component";
import { Fido2UseBrowserLinkComponent } from "../autofill/popup/fido2/fido2-use-browser-link.component";
import { Fido2V1Component } from "../autofill/popup/fido2/fido2-v1.component";
import { Fido2Component } from "../autofill/popup/fido2/fido2.component";
import { AutofillV1Component } from "../autofill/popup/settings/autofill-v1.component";
import { AutofillComponent } from "../autofill/popup/settings/autofill.component";
import { ExcludedDomainsV1Component } from "../autofill/popup/settings/excluded-domains-v1.component";
import { ExcludedDomainsComponent } from "../autofill/popup/settings/excluded-domains.component";
import { NotificationsSettingsV1Component } from "../autofill/popup/settings/notifications-v1.component";
import { NotificationsSettingsComponent } from "../autofill/popup/settings/notifications.component";
import { PopOutComponent } from "../platform/popup/components/pop-out.component";
import { HeaderComponent } from "../platform/popup/header.component";
import { PopupFooterComponent } from "../platform/popup/layout/popup-footer.component";
import { PopupHeaderComponent } from "../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../platform/popup/layout/popup-page.component";
import { PopupTabNavigationComponent } from "../platform/popup/layout/popup-tab-navigation.component";
import { FilePopoutCalloutComponent } from "../tools/popup/components/file-popout-callout.component";
import { ActionButtonsComponent } from "../vault/popup/components/action-buttons.component";
import { CipherRowComponent } from "../vault/popup/components/cipher-row.component";
import { AddEditCustomFieldsComponent } from "../vault/popup/components/vault/add-edit-custom-fields.component";
import { AddEditComponent } from "../vault/popup/components/vault/add-edit.component";
import { AttachmentsComponent } from "../vault/popup/components/vault/attachments.component";
import { CollectionsComponent } from "../vault/popup/components/vault/collections.component";
import { CurrentTabComponent } from "../vault/popup/components/vault/current-tab.component";
import { PasswordHistoryComponent } from "../vault/popup/components/vault/password-history.component";
import { ShareComponent } from "../vault/popup/components/vault/share.component";
import { VaultFilterComponent } from "../vault/popup/components/vault/vault-filter.component";
import { VaultItemsComponent } from "../vault/popup/components/vault/vault-items.component";
import { VaultSelectComponent } from "../vault/popup/components/vault/vault-select.component";
import { ViewCustomFieldsComponent } from "../vault/popup/components/vault/view-custom-fields.component";
import { ViewComponent } from "../vault/popup/components/vault/view.component";
import { AppearanceComponent } from "../vault/popup/settings/appearance.component";
import { FolderAddEditComponent } from "../vault/popup/settings/folder-add-edit.component";
import { FoldersComponent } from "../vault/popup/settings/folders.component";
import { SyncComponent } from "../vault/popup/settings/sync.component";
import { VaultSettingsComponent } from "../vault/popup/settings/vault-settings.component";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { UserVerificationComponent } from "./components/user-verification.component";
import { ServicesModule } from "./services/services.module";
import { TabsV2Component } from "./tabs-v2.component";

// Register the locales for the application
import "../platform/popup/locales";

@NgModule({
  imports: [
    A11yModule,
    AppRoutingModule,
    AutofillComponent,
    AccountSecurityComponent,
    ToastModule.forRoot({
      maxOpened: 2,
      autoDismiss: true,
      closeButton: true,
      positionClass: "toast-top-full-width",
    }),
    BrowserAnimationsModule,
    BrowserModule,
    DragDropModule,
    FormsModule,
    JslibModule,
    LayoutModule,
    OverlayModule,
    ReactiveFormsModule,
    ScrollingModule,
    ServicesModule,
    DialogModule,
    ExcludedDomainsComponent,
    Fido2CipherRowComponent,
    Fido2Component,
    Fido2UseBrowserLinkComponent,
    FilePopoutCalloutComponent,
    AvatarModule,
    AccountComponent,
    ButtonModule,
    NotificationsSettingsComponent,
    PopOutComponent,
    PopupPageComponent,
    PopupTabNavigationComponent,
    PopupFooterComponent,
    PopupHeaderComponent,
    HeaderComponent,
    UserVerificationDialogComponent,
    CurrentAccountComponent,
    FormFieldModule,
    ExtensionAnonLayoutWrapperComponent,
  ],
  declarations: [
    ActionButtonsComponent,
    AddEditComponent,
    AddEditCustomFieldsComponent,
    AppComponent,
    AttachmentsComponent,
    CipherRowComponent,
    VaultItemsComponent,
    CollectionsComponent,
    ColorPasswordPipe,
    ColorPasswordCountPipe,
    CurrentTabComponent,
    EnvironmentComponent,
    ExcludedDomainsV1Component,
    Fido2CipherRowV1Component,
    Fido2UseBrowserLinkV1Component,
    FolderAddEditComponent,
    FoldersComponent,
    VaultFilterComponent,
    HintComponent,
    HomeComponent,
    LoginViaAuthRequestComponentV1,
    LoginComponentV1,
    LoginDecryptionOptionsComponentV1,
    NotificationsSettingsV1Component,
    AppearanceComponent,
    PasswordHistoryComponent,
    RegisterComponent,
    SetPasswordComponent,
    VaultSettingsComponent,
    ShareComponent,
    SsoComponentV1,
    SyncComponent,
    TabsV2Component,
    TwoFactorComponent,
    TwoFactorOptionsComponent,
    UpdateTempPasswordComponent,
    UserVerificationComponent,
    VaultTimeoutInputComponent,
    ViewComponent,
    ViewCustomFieldsComponent,
    RemovePasswordComponent,
    VaultSelectComponent,
    Fido2V1Component,
    AutofillV1Component,
    EnvironmentSelectorComponent,
  ],
  exports: [],
  providers: [CurrencyPipe, DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
