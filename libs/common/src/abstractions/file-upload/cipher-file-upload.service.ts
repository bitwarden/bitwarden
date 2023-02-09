import { EncArrayBuffer } from "../../models/domain/enc-array-buffer";
import { EncString } from "../../models/domain/enc-string";
import { SymmetricCryptoKey } from "../../models/domain/symmetric-crypto-key";
import { Cipher } from "../../vault/models/domain/cipher";
import { CipherResponse } from "../../vault/models/response/cipher.response";

export abstract class CipherFileUploadService {
  upload: (
    cipher: Cipher,
    encFileName: EncString,
    encData: EncArrayBuffer,
    admin: boolean,
    dataEncKey: [SymmetricCryptoKey, EncString]
  ) => Promise<CipherResponse>;
}
