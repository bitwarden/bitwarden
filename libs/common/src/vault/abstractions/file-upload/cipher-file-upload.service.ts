// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { EncArrayBuffer, EncString, SymmetricCryptoKey } from "@bitwarden/key-management";

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
