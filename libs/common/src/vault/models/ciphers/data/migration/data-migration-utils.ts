import { EncString } from "../../../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../../../platform/models/domain/symmetric-crypto-key";

// OrganizationId should eventually be removed from this function, see comment on Cipher.decrypt
export async function decryptString(
  encrypted: string,
  organizationId: string,
  key: SymmetricCryptoKey,
): Promise<string> {
  const encString = new EncString(encrypted);
  const decrypted = await encString.decrypt(organizationId, key);

  return decrypted;
}
