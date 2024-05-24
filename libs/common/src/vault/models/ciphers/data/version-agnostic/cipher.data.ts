import { Jsonify } from "type-fest";

import { SymmetricCryptoKey } from "../../../../../platform/models/domain/symmetric-crypto-key";
import { CipherResponseV1 } from "../../response/v1/cipher.response";
import { CipherResponseV2 } from "../../response/v2/cipher.response";
import { CipherResponse } from "../../response/version-agnostic/cipher.response";
import { AttachmentDataLatest, CipherDataLatest } from "../latest";
import { CipherDataUnknownVersion } from "../unknown/cipher.data";
import { CipherDataV1 } from "../v1/cipher.data";
import { CipherDataV2 } from "../v2/cipher.data";

export type CipherDataAnyVersion = CipherDataUnknownVersion | CipherDataV1 | CipherDataV2;

export class CipherData {
  value: CipherDataAnyVersion;

  constructor(responseOrData?: CipherResponse | CipherDataAnyVersion, collectionIds?: string[]) {
    if (responseOrData == undefined) {
      return;
    }

    if (responseOrData instanceof CipherResponse) {
      this.value = this.constructData(responseOrData, collectionIds);
      return;
    }

    this.value = responseOrData;
  }

  get id() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return undefined;
    }

    return this.value.id;
  }

  get organizationId() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return undefined;
    }

    return this.value.organizationId;
  }

  get folderId() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return undefined;
    }

    return this.value.folderId;
  }

  set folderId(value: string) {
    if (this.value instanceof CipherDataUnknownVersion) {
      return;
    }

    this.value.folderId = value;
  }

  get attachments() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return undefined;
    }

    return this.value.attachments;
  }

  // TODO: This is version specific operation. We really need to get rid of all
  // the getters and setters.
  set attachments(value: AttachmentDataLatest[]) {
    if (this.value instanceof CipherDataUnknownVersion) {
      return;
    }

    this.value.attachments = value;
  }

  get collectionIds() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return undefined;
    }

    return this.value.collectionIds;
  }

  set collectionIds(value: string[]) {
    if (this.value instanceof CipherDataUnknownVersion) {
      return;
    }

    this.value.collectionIds = value;
  }

  // TODO: This is a temporary solution for CipherService.
  // We probably shouldn't be directly modifying data objects.
  get deletedDate() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return undefined;
    }

    return this.value.deletedDate;
  }

  set deletedDate(value: string) {
    if (this.value instanceof CipherDataUnknownVersion) {
      return;
    }

    this.value.deletedDate = value;
  }

  // TODO: This is a temporary solution for CipherService.
  // We probably shouldn't be directly modifying data objects.
  get revisionDate() {
    if (this.value instanceof CipherDataUnknownVersion) {
      return undefined;
    }

    return this.value.revisionDate;
  }

  set revisionDate(value: string) {
    if (this.value instanceof CipherDataUnknownVersion) {
      return;
    }

    this.value.revisionDate = value;
  }

  /**
   * This function will migrate any underlying data object to the latest version
   * @param key Used to decrypt fields that need to be read for migration
   */
  async toLatestVersion(key: SymmetricCryptoKey): Promise<CipherDataLatest> {
    let to_be_migrated = this.value;
    while (!(to_be_migrated instanceof CipherDataLatest)) {
      if (to_be_migrated instanceof CipherDataV1) {
        to_be_migrated = await CipherDataV2.migrate(to_be_migrated, key);
      } else if (to_be_migrated instanceof CipherDataUnknownVersion) {
        // TODO: Implement support for unknown versions.
        // There are two ways to handle this:
        // 1. Let this function return `Promise<CipherDataLatest | undefined>` and return `undefined` if the version is unknown.
        //    The CipherService should then check for `undefined` and set a global flag on itself to indicate that the vault contains
        //    ciphers of unknown version. The UI should check this flag and display a warning to the user.
        // 2. Let this function return `Promise<CipherDataLatest | CipherDataUnknownVersion>`. Then create a new domain object
        //    `CipherUnknown` that can be created from CipherDataUnknownVersion. We can then add support for this
        //    in the rest of the application by e.g. displaying a special "UnknownCipherRow" in the vault item list.
        throw new Error("Cannot migrate unknown version");
      }
    }
    throw new Error("Not yet implemented");
  }

  private constructData(response: CipherResponse, collectionIds?: string[]) {
    if (response.value instanceof CipherResponseV1) {
      return new CipherDataV1(response.value, collectionIds);
    } else if (response.value instanceof CipherResponseV2) {
      return new CipherDataV2(response.value, collectionIds);
    } else {
      return new CipherDataUnknownVersion(response.value);
    }
  }

  static fromJSON(obj: Jsonify<CipherData>) {
    let value: CipherDataAnyVersion;

    switch (obj.value.version) {
      case 1:
        value = CipherDataV1.fromJSON(obj.value);
        break;
      case 2:
        value = CipherDataV2.fromJSON(obj.value);
        break;
      default:
        value = CipherDataUnknownVersion.fromJSON(obj.value);
        break;
    }

    const toReturn = new CipherData();
    toReturn.value = value;

    return toReturn;
  }
}
