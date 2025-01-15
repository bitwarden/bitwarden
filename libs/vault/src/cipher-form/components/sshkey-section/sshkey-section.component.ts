// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { firstValueFrom, lastValueFrom } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { SdkService } from "@bitwarden/common/platform/abstractions/sdk/sdk.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { SshKeyView } from "@bitwarden/common/vault/models/view/ssh-key.view";
import {
  CardComponent,
  DialogService,
  FormFieldModule,
  IconButtonModule,
  SectionComponent,
  SectionHeaderComponent,
  SelectModule,
  ToastService,
  TypographyModule,
} from "@bitwarden/components";
import { SshKeyPasswordPromptComponent } from "@bitwarden/importer/ui";
import {
  SshKey,
  SshKeyImportError,
  import_ssh_key,
  generate_ssh_key,
} from "@bitwarden/sdk-internal";

import { CipherFormContainer } from "../../cipher-form-container";

@Component({
  selector: "vault-sshkey-section",
  templateUrl: "./sshkey-section.component.html",
  standalone: true,
  imports: [
    CardComponent,
    SectionComponent,
    TypographyModule,
    FormFieldModule,
    ReactiveFormsModule,
    SelectModule,
    SectionHeaderComponent,
    IconButtonModule,
    JslibModule,
    CommonModule,
  ],
})
export class SshKeySectionComponent implements OnInit {
  /** The original cipher */
  @Input() originalCipherView: CipherView;

  /** True when all fields should be disabled */
  @Input() disabled: boolean;

  /**
   * All form fields associated with the ssh key
   *
   * Note: `as` is used to assert the type of the form control,
   * leaving as just null gets inferred as `unknown`
   */
  sshKeyForm = this.formBuilder.group({
    privateKey: [""],
    publicKey: [""],
    keyFingerprint: [""],
  });

  constructor(
    private cipherFormContainer: CipherFormContainer,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    private toastService: ToastService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private dialogService: DialogService,
    private sdkService: SdkService,
  ) {
    this.cipherFormContainer.registerChildForm("sshKeyDetails", this.sshKeyForm);
    this.sshKeyForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const data = new SshKeyView();
      data.privateKey = value.privateKey;
      data.publicKey = value.publicKey;
      data.keyFingerprint = value.keyFingerprint;
      this.cipherFormContainer.patchCipher((cipher) => {
        cipher.sshKey = data;
        return cipher;
      });
    });
  }

  async ngOnInit() {
    if (this.originalCipherView?.sshKey) {
      this.setInitialValues();
    } else {
      await this.generateSshKey();
    }

    this.sshKeyForm.disable();
  }

  /** Set form initial form values from the current cipher */
  private setInitialValues() {
    const { privateKey, publicKey, keyFingerprint } = this.originalCipherView.sshKey;

    this.sshKeyForm.setValue({
      privateKey,
      publicKey,
      keyFingerprint,
    });
  }

  private async importUsingSdk(key: string, password: string): Promise<SshKey> {
    await firstValueFrom(this.sdkService.client$);
    return import_ssh_key(key, password);
  }

  async importSshKeyFromClipboard(password: string = "") {
    const ATTEMPTS = 5;
    const key = await this.platformUtilsService.readFromClipboard();

    let parsedKey: SshKey = null;
    for (let attempt = 0; attempt <= ATTEMPTS; attempt++) {
      try {
        parsedKey = await this.importUsingSdk(key, password);
      } catch (e) {
        const error = e as SshKeyImportError;
        if (
          error.variant === "WrongPassword" &&
          ((password === "" && attempt === 0) || (password !== "" && attempt < ATTEMPTS))
        ) {
          password = await this.getSshKeyPassword();
        } else {
          this.toastService.showToast({
            variant: "error",
            title: "",
            message: this.i18nService.t(this.sshImportErrorVariantToI18nKey(error.variant)),
          });
          return;
        }
        continue;
      }
      break;
    }

    this.sshKeyForm.setValue({
      privateKey: parsedKey.private_key,
      publicKey: parsedKey.public_key,
      keyFingerprint: parsedKey.key_fingerprint,
    });

    this.toastService.showToast({
      variant: "success",
      title: "",
      message: this.i18nService.t("sshKeyPasted"),
    });
  }

  private sshImportErrorVariantToI18nKey(variant: string): string {
    switch (variant) {
      case "ParsingError":
        return "invalidSshKey";
      case "UnsupportedKeyType":
        return "sshKeyTypeUnsupported";
      case "PasswordRequired":
      case "WrongPassword":
        return "sshKeyWrongPassword";
      default:
        return "errorOccurred";
    }
  }

  async getSshKeyPassword(): Promise<string> {
    const dialog = this.dialogService.open<string>(SshKeyPasswordPromptComponent, {
      ariaModal: true,
    });

    return await lastValueFrom(dialog.closed);
  }
  private async generateSshKey() {
    await firstValueFrom(this.sdkService.client$);
    const sshKey = generate_ssh_key("Ed25519");
    this.sshKeyForm.setValue({
      privateKey: sshKey.private_key,
      publicKey: sshKey.public_key,
      keyFingerprint: sshKey.key_fingerprint,
    });
  }
}
