// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { EncString } from "@bitwarden/key-management";

import { EncArrayBuffer } from "../../../../../key-management/src/cryptography/domain/enc-array-buffer";
import { SymmetricCryptoKey } from "../../../../../key-management/src/cryptography/domain/symmetric-crypto-key";
import { Cipher } from "../../models/domain/cipher";
import { CipherResponse } from "../../models/response/cipher.response";

export abstract class CipherFileUploadService {
  upload: (
    cipher: Cipher,
    encFileName: EncString,
    encData: EncArrayBuffer,
    admin: boolean,
    dataEncKey: [SymmetricCryptoKey, EncString],
  ) => Promise<CipherResponse>;
}
