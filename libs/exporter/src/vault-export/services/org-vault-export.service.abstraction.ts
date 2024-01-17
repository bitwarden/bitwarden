import { ExportFormat } from "./vault-export.service.abstraction";

export abstract class OrganizationVaultExportServiceAbstraction {
  getPasswordProtectedExport: (
    organizationId: string,
    password: string,
    onlyManagedCollections?: boolean,
  ) => Promise<string>;
  getOrganizationExport: (
    organizationId: string,
    format: ExportFormat,
    onlyManagedCollections: boolean,
  ) => Promise<string>;
}
