import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { ImportResult } from "../models/import-result";

import { BaseImporter } from "./base-importer";
import { Importer } from "./importer";

const _mappedColumns = new Set(["Title", "Username", "URL", "Password", "Description"]);

export class PasswordXPCsvImporter extends BaseImporter implements Importer {
  parse(data: string): Promise<ImportResult> {
    // The header column 'User name' is parsed by the parser, but cannot be used as a variable. This converts it to a valid variable name, prior to parsing.
    data = data.replace(";User name;", ";Username;");

    const result = new ImportResult();
    const results = this.parseCsv(data, true, { skipEmptyLines: true });
    if (results == null) {
      result.success = false;
      return Promise.resolve(result);
    }
    results.forEach((row) => {
      // Skip rows starting with '>>>' as they indicate items following have no folder assigned to them
      if (row.Title == ">>>") {
        return;
      }

      const cipher = this.initLoginCipher();
      cipher.name = this.getValueOrDefault(row.Title);
      cipher.login.username = this.getValueOrDefault(row.Username);
      cipher.notes = this.getValueOrDefault(row.Description);
      cipher.login.uris = this.makeUriArray(row.URL);
      cipher.login.password = this.getValueOrDefault(row.Password);

      this.importUnmappedFields(cipher, row, _mappedColumns);

      this.convertToNoteIfNeeded(cipher);
      this.cleanupCipher(cipher);
      result.ciphers.push(cipher);
    });

    result.success = true;
    return Promise.resolve(result);
  }

  importUnmappedFields(cipher: CipherView, row: any, mappedValues: Set<string>) {
    const unmappedFields = Object.keys(row).filter((x) => !mappedValues.has(x));
    unmappedFields.forEach((key) => {
      const item = row as any;
      this.processKvp(cipher, key, item[key]);
    });
  }
}
