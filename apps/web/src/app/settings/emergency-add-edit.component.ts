import { Component } from "@angular/core";

import { AuditService } from "@bitwarden/common/src/abstractions/audit.service";
import { CipherService } from "@bitwarden/common/src/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/src/abstractions/collection.service";
import { EventService } from "@bitwarden/common/src/abstractions/event.service";
import { FolderService } from "@bitwarden/common/src/abstractions/folder.service";
import { I18nService } from "@bitwarden/common/src/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/src/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/src/abstractions/messaging.service";
import { OrganizationService } from "@bitwarden/common/src/abstractions/organization.service";
import { PasswordGenerationService } from "@bitwarden/common/src/abstractions/passwordGeneration.service";
import { PasswordRepromptService } from "@bitwarden/common/src/abstractions/passwordReprompt.service";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/src/abstractions/policy.service";
import { StateService } from "@bitwarden/common/src/abstractions/state.service";
import { TotpService } from "@bitwarden/common/src/abstractions/totp.service";
import { Cipher } from "@bitwarden/common/src/models/domain/cipher";

import { AddEditComponent as BaseAddEditComponent } from "../vault/add-edit.component";

@Component({
  selector: "app-org-vault-add-edit",
  templateUrl: "../vault/add-edit.component.html",
})
export class EmergencyAddEditComponent extends BaseAddEditComponent {
  originalCipher: Cipher = null;
  viewOnly = true;

  constructor(
    cipherService: CipherService,
    folderService: FolderService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    auditService: AuditService,
    stateService: StateService,
    collectionService: CollectionService,
    totpService: TotpService,
    passwordGenerationService: PasswordGenerationService,
    messagingService: MessagingService,
    eventService: EventService,
    policyService: PolicyService,
    passwordRepromptService: PasswordRepromptService,
    organizationService: OrganizationService,
    logService: LogService
  ) {
    super(
      cipherService,
      folderService,
      i18nService,
      platformUtilsService,
      auditService,
      stateService,
      collectionService,
      totpService,
      passwordGenerationService,
      messagingService,
      eventService,
      policyService,
      organizationService,
      logService,
      passwordRepromptService
    );
  }

  async load() {
    this.title = this.i18nService.t("viewItem");
  }

  protected async loadCipher() {
    return Promise.resolve(this.originalCipher);
  }
}
