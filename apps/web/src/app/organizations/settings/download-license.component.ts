import { Component, EventEmitter, Input, Output } from "@angular/core";

import { ApiService } from "@bitwarden/common/src/abstractions/api.service";
import { LogService } from "@bitwarden/common/src/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";

@Component({
  selector: "app-download-license",
  templateUrl: "download-license.component.html",
})
export class DownloadLicenseComponent {
  @Input() organizationId: string;
  @Output() onDownloaded = new EventEmitter();
  @Output() onCanceled = new EventEmitter();

  installationId: string;
  formPromise: Promise<any>;

  constructor(
    private apiService: ApiService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService
  ) {}

  async submit() {
    if (this.installationId == null || this.installationId === "") {
      return;
    }

    try {
      this.formPromise = this.apiService.getOrganizationLicense(
        this.organizationId,
        this.installationId
      );
      const license = await this.formPromise;
      const licenseString = JSON.stringify(license, null, 2);
      this.platformUtilsService.saveFile(
        window,
        licenseString,
        null,
        "bitwarden_organization_license.json"
      );
      this.onDownloaded.emit();
    } catch (e) {
      this.logService.error(e);
    }
  }

  cancel() {
    this.onCanceled.emit();
  }
}
