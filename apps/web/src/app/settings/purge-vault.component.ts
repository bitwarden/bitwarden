import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";

import { ApiService } from "@bitwarden/common/src/abstractions/api.service";
import { I18nService } from "@bitwarden/common/src/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/src/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";
import { UserVerificationService } from "@bitwarden/common/src/abstractions/userVerification.service";
import { Verification } from "@bitwarden/common/src/types/verification";

@Component({
  selector: "app-purge-vault",
  templateUrl: "purge-vault.component.html",
})
export class PurgeVaultComponent {
  @Input() organizationId?: string = null;

  masterPassword: Verification;
  formPromise: Promise<any>;

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private userVerificationService: UserVerificationService,
    private router: Router,
    private logService: LogService
  ) {}

  async submit() {
    try {
      this.formPromise = this.userVerificationService
        .buildRequest(this.masterPassword)
        .then((request) => this.apiService.postPurgeCiphers(request, this.organizationId));
      await this.formPromise;
      this.platformUtilsService.showToast("success", null, this.i18nService.t("vaultPurged"));
      if (this.organizationId != null) {
        this.router.navigate(["organizations", this.organizationId, "vault"]);
      } else {
        this.router.navigate(["vault"]);
      }
    } catch (e) {
      this.logService.error(e);
    }
  }
}
