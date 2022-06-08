import { Component } from "@angular/core";

import { ApiService } from "@bitwarden/common/src/abstractions/api.service";
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
import { CipherData } from "@bitwarden/common/src/models/data/cipherData";
import { Cipher } from "@bitwarden/common/src/models/domain/cipher";
import { Organization } from "@bitwarden/common/src/models/domain/organization";
import { CipherCreateRequest } from "@bitwarden/common/src/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/src/models/request/cipherRequest";

import { AddEditComponent as BaseAddEditComponent } from "../../vault/add-edit.component";

@Component({
  selector: "app-org-vault-add-edit",
  templateUrl: "../../vault/add-edit.component.html",
})
export class AddEditComponent extends BaseAddEditComponent {
  organization: Organization;
  originalCipher: Cipher = null;

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
    private apiService: ApiService,
    messagingService: MessagingService,
    eventService: EventService,
    policyService: PolicyService,
    logService: LogService,
    passwordRepromptService: PasswordRepromptService,
    organizationService: OrganizationService
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

  protected allowOwnershipAssignment() {
    if (
      this.ownershipOptions != null &&
      (this.ownershipOptions.length > 1 || !this.allowPersonal)
    ) {
      if (this.organization != null) {
        return this.cloneMode && this.organization.canEditAnyCollection;
      } else {
        return !this.editMode || this.cloneMode;
      }
    }
    return false;
  }

  protected loadCollections() {
    if (!this.organization.canEditAnyCollection) {
      return super.loadCollections();
    }
    return Promise.resolve(this.collections);
  }

  protected async loadCipher() {
    if (!this.organization.canEditAnyCollection) {
      return await super.loadCipher();
    }
    const response = await this.apiService.getCipherAdmin(this.cipherId);
    const data = new CipherData(response);
    this.originalCipher = new Cipher(data);
    return new Cipher(data);
  }

  protected encryptCipher() {
    if (!this.organization.canEditAnyCollection) {
      return super.encryptCipher();
    }
    return this.cipherService.encrypt(this.cipher, null, this.originalCipher);
  }

  protected async saveCipher(cipher: Cipher) {
    if (!this.organization.canEditAnyCollection || cipher.organizationId == null) {
      return super.saveCipher(cipher);
    }
    if (this.editMode && !this.cloneMode) {
      const request = new CipherRequest(cipher);
      return this.apiService.putCipherAdmin(this.cipherId, request);
    } else {
      const request = new CipherCreateRequest(cipher);
      return this.apiService.postCipherAdmin(request);
    }
  }

  protected async deleteCipher() {
    if (!this.organization.canEditAnyCollection) {
      return super.deleteCipher();
    }
    return this.cipher.isDeleted
      ? this.apiService.deleteCipherAdmin(this.cipherId)
      : this.apiService.putDeleteCipherAdmin(this.cipherId);
  }
}
