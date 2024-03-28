import { Component, OnInit } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { PasswordRepromptService } from "@bitwarden/vault";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-unsecured-websites-report",
  templateUrl: "unsecured-websites-report.component.html",
})
export class UnsecuredWebsitesReportComponent extends CipherReportComponent implements OnInit {
  disabled = true;

  constructor(
    protected cipherService: CipherService,
    protected organizationService: OrganizationService,
    modalService: ModalService,
    passwordRepromptService: PasswordRepromptService,
    i18nService: I18nService,
  ) {
    super(modalService, passwordRepromptService, organizationService, i18nService);
  }

  async ngOnInit() {
    await super.load();
  }

  async setCiphers() {
    const allCiphers = await this.getAllCiphers();
    const unsecuredCiphers = allCiphers.filter((c) => {
      if (c.type !== CipherType.Login || !c.login.hasUris || c.isDeleted) {
        return false;
      }
      return c.login.uris.some((u) => u.uri != null && u.uri.indexOf("http://") === 0);
    });
    this.ciphers = unsecuredCiphers.filter(
      (c) => (!this.organization && c.edit) || (this.organization && !c.edit),
    );
  }

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }
}
