import { Component, EventEmitter, Input, OnDestroy, Output } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { EventService } from "@bitwarden/common/abstractions/event.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PasswordRepromptService } from "@bitwarden/common/abstractions/passwordReprompt.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { SearchService } from "@bitwarden/common/abstractions/search.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { TokenService } from "@bitwarden/common/abstractions/token.service";
import { TotpService } from "@bitwarden/common/abstractions/totp.service";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { GroupResponse } from "@bitwarden/common/models/response/groupResponse";
import { CipherView } from "@bitwarden/common/models/view/cipherView";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

import { BulkDeleteComponent } from "src/app/vault/bulk-delete.component";

import { CiphersComponent as BaseCiphersComponent } from "../../vault/ciphers.component";

@Component({
  selector: "app-org-vault-ciphers",
  templateUrl: "../../vault/ciphers.component.html",
})
export class CiphersComponent extends BaseCiphersComponent implements OnDestroy {
  @Input() collections: CollectionView[];
  @Output() onEventsClicked = new EventEmitter<CipherView>();

  organization: Organization;
  groups: GroupResponse[] = [];
  accessEvents = false;
  showOrganizationBadge = false;

  protected allCiphers: CipherView[] = [];

  constructor(
    searchService: SearchService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    cipherService: CipherService,
    eventService: EventService,
    totpService: TotpService,
    passwordRepromptService: PasswordRepromptService,
    modalService: ModalService,
    logService: LogService,
    stateService: StateService,
    organizationService: OrganizationService,
    tokenService: TokenService,
    private apiService: ApiService
  ) {
    super(
      searchService,
      i18nService,
      platformUtilsService,
      cipherService,
      eventService,
      totpService,
      stateService,
      passwordRepromptService,
      modalService,
      logService,
      organizationService,
      tokenService
    );
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  async load(filter: (cipher: CipherView) => boolean = null, deleted = false) {
    this.groups = (await this.apiService.getGroups(this.organization.id)).data;
    this.deleted = deleted || false;
    if (this.organization.canEditAnyCollection) {
      this.accessEvents = this.organization.useEvents;
      this.allCiphers = await this.cipherService.getAllFromApiForOrganization(this.organization.id);
    } else {
      this.allCiphers = (await this.cipherService.getAllDecrypted()).filter(
        (c) => c.organizationId === this.organization.id
      );
    }
    await this.searchService.indexCiphers(this.organization.id, this.allCiphers);
    await this.applyFilter(filter);
    this.loaded = true;
  }

  async applyFilter(filter: (cipher: CipherView) => boolean = null) {
    if (this.organization.canViewAllCollections) {
      await super.applyFilter(filter);
    } else {
      const f = (c: CipherView) =>
        c.organizationId === this.organization.id && (filter == null || filter(c));
      await super.applyFilter(f);
    }
  }

  async search(timeout: number = null) {
    await super.search(timeout, this.allCiphers);
  }
  events(c: CipherView) {
    this.onEventsClicked.emit(c);
  }

  protected deleteCipher(id: string) {
    if (!this.organization.canEditAnyCollection) {
      return super.deleteCipher(id, this.deleted);
    }
    return this.deleted
      ? this.apiService.deleteCipherAdmin(id)
      : this.apiService.putDeleteCipherAdmin(id);
  }

  protected showFixOldAttachments(c: CipherView) {
    return this.organization.canEditAnyCollection && c.hasOldAttachments;
  }

  async bulkDelete() {
    if (!(await this.repromptCipher())) {
      return;
    }

    const selectedIds = this.getSelectedIds();
    if (selectedIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkDeleteComponent,
      this.bulkDeleteModalRef,
      (comp) => {
        comp.permanent = this.deleted;
        comp.cipherIds = selectedIds;
        comp.organization = this.organization;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onDeleted.subscribe(async () => {
          modal.close();
          await this.refresh();
        });
      }
    );
  }
}
