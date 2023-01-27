import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { ImportError } from "@bitwarden/common/importers/import-error";
import { EncString } from "@bitwarden/common/models/domain/enc-string";

import {
  SecretsManagerExport,
  SMExportProject,
  SMExportSecret,
} from "../../models/porting/sm-export";
import { ImportedProjectRequest } from "../requests/imported-project.request";
import { ImportedSecretRequest } from "../requests/imported-secret.request";
import { SMImportRequest } from "../requests/sm-import.request";
import { SMExportResponse } from "../responses/sm-export.response";

@Injectable({
  providedIn: "root",
})
export class SMPortingService {
  constructor(
    private apiService: ApiService,
    private encryptService: EncryptService,
    private cryptoService: CryptoService
  ) {}

  async export(organizationId: string, exportFormat = "json"): Promise<string> {
    const r = await this.apiService.send(
      "GET",
      "/sm/" + organizationId + "/export?format=" + exportFormat,
      null,
      true,
      true
    );

    return JSON.stringify(
      await this.decryptExport(organizationId, new SMExportResponse(r)),
      null,
      "  "
    );
  }

  async import(organizationId: string, request: string): Promise<ImportError> {
    const requestObject = JSON.parse(request);
    const requestBody = await this.encryptImport(organizationId, requestObject);

    await this.apiService.send(
      "POST",
      "/sm/" + organizationId + "/import",
      requestBody,
      true,
      true
    );

    return null;
  }

  private async encryptImport(organizationId: string, importData: any): Promise<SMImportRequest> {
    const encryptedImport = new SMImportRequest();

    try {
      const orgKey = await this.cryptoService.getOrgKey(organizationId);
      encryptedImport.projects = [];
      encryptedImport.secrets = [];

      encryptedImport.projects = await Promise.all(
        importData.projects.map(async (p: any) => {
          const project = new ImportedProjectRequest();
          project.id = p.id;
          project.name = await this.encryptService.encrypt(p.name, orgKey);
          return project;
        })
      );

      encryptedImport.secrets = await Promise.all(
        importData.secrets.map(async (s: any) => {
          const secret = new ImportedSecretRequest();

          [secret.key, secret.value, secret.note] = await Promise.all([
            this.encryptService.encrypt(s.key, orgKey),
            this.encryptService.encrypt(s.value, orgKey),
            this.encryptService.encrypt(s.note, orgKey),
          ]);

          secret.id = s.id;
          secret.projectIds = s.projectIds;

          return secret;
        })
      );
    } catch (e) {
      // TODO: handle exception
    }

    return encryptedImport;
  }

  private async decryptExport(
    organizationId: string,
    exportData: SMExportResponse
  ): Promise<SecretsManagerExport> {
    const orgKey = await this.cryptoService.getOrgKey(organizationId);
    const decryptedExport = new SecretsManagerExport();
    decryptedExport.projects = [];
    decryptedExport.secrets = [];

    decryptedExport.projects = await Promise.all(
      exportData.projects.map(async (p) => {
        const project = new SMExportProject();
        project.id = p.id;
        project.name = await this.encryptService.decryptToUtf8(new EncString(p.name), orgKey);
        return project;
      })
    );

    decryptedExport.secrets = await Promise.all(
      exportData.secrets.map(async (s) => {
        const secret = new SMExportSecret();

        [secret.key, secret.value, secret.note] = await Promise.all([
          this.encryptService.decryptToUtf8(new EncString(s.key), orgKey),
          this.encryptService.decryptToUtf8(new EncString(s.value), orgKey),
          this.encryptService.decryptToUtf8(new EncString(s.note), orgKey),
        ]);

        secret.id = s.id;
        secret.projectIds = s.projectIds;

        return secret;
      })
    );

    return decryptedExport;
  }
}
