import { Component, OnInit } from "@angular/core";

import { ModalService } from "@bitwarden/angular/src/services/modal.service";
import { CipherService } from "@bitwarden/common/src/abstractions/cipher.service";
import { MessagingService } from "@bitwarden/common/src/abstractions/messaging.service";
import { PasswordRepromptService } from "@bitwarden/common/src/abstractions/passwordReprompt.service";
import { StateService } from "@bitwarden/common/src/abstractions/state.service";
import { CipherType } from "@bitwarden/common/src/enums/cipherType";
import { CipherView } from "@bitwarden/common/src/models/view/cipherView";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-unsecured-websites-report",
  templateUrl: "unsecured-websites-report.component.html",
})
export class UnsecuredWebsitesReportComponent extends CipherReportComponent implements OnInit {
  constructor(
    protected cipherService: CipherService,
    modalService: ModalService,
    messagingService: MessagingService,
    stateService: StateService,
    passwordRepromptService: PasswordRepromptService
  ) {
    super(modalService, messagingService, true, stateService, passwordRepromptService);
  }

  async ngOnInit() {
    if (await this.checkAccess()) {
      await super.load();
    }
  }

  async setCiphers() {
    const allCiphers = await this.getAllCiphers();
    const unsecuredCiphers = allCiphers.filter((c) => {
      if (c.type !== CipherType.Login || !c.login.hasUris || c.isDeleted) {
        return false;
      }
      return c.login.uris.some((u) => u.uri != null && u.uri.indexOf("http://") === 0);
    });
    this.ciphers = unsecuredCiphers;
  }

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }
}
