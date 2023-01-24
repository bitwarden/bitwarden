import { Cipher } from "../../vault/models/domain/cipher";

export class CipherPartialRequest {
  folderId: string;
  favorite: boolean;

  constructor(cipher: Cipher) {
    this.folderId = cipher.folderId;
    this.favorite = cipher.favorite;
  }
}
