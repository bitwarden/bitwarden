import { mock } from "jest-mock-extended";

import { KdfConfig } from "../../auth/models/domain/kdf-config";
import { CsprngArray } from "../../types/csprng";
import { CryptoFunctionService } from "../abstractions/crypto-function.service";
import { KdfType } from "../enums";

import { KeyGenerationService } from "./key-generation.service";

describe("KeyGenerationService", () => {
  let sut: KeyGenerationService;

  const cryptoFunctionService = mock<CryptoFunctionService>();

  beforeEach(() => {
    sut = new KeyGenerationService(cryptoFunctionService);
  });

  describe("createKey", () => {
    test.each([256, 512])(
      "it should create a key of the specified length",
      async (bitLength: 256 | 512) => {
        cryptoFunctionService.aesGenerateKey
          .calledWith(bitLength)
          .mockResolvedValue(new Uint8Array(bitLength / 8) as CsprngArray);

        const key = await sut.createKey(bitLength);

        expect(key.key.length).toEqual(bitLength / 8);
      },
    );
  });

  describe("createMaterialAndKey", () => {
    test.each([128, 192, 256, 512])(
      "should create a 64 byte key from different material lengths",
      async (bitLength: 128 | 192 | 256 | 512) => {
        const material = new Uint8Array(bitLength / 8) as CsprngArray;
        const salt = "salt";
        const purpose = "purpose";

        cryptoFunctionService.aesGenerateKey.calledWith(bitLength).mockResolvedValue(material);
        cryptoFunctionService.hkdf
          .calledWith(material, salt, purpose, 64, "sha256")
          .mockResolvedValue(new Uint8Array(64));

        const [actualMaterial, key] = await sut.createMaterialAndKey(bitLength, salt, purpose);

        expect(actualMaterial).toEqual(material);
        expect(key.key.length).toEqual(64);
      },
    );
  });

  describe("deriveKeyFromMaterial", () => {
    it("should derive a 64 byte key from material", async () => {
      const material = new Uint8Array(32) as CsprngArray;
      const salt = "salt";
      const purpose = "purpose";

      cryptoFunctionService.hkdf.mockResolvedValue(new Uint8Array(64));

      const key = await sut.deriveKeyFromMaterial(material, salt, purpose);

      expect(key.key.length).toEqual(64);
    });
  });

  describe("deriveKeyFromPassword", () => {
    it("should derive a 32 byte key from a password using pbkdf2", async () => {
      const password = "password";
      const salt = "salt";
      const kdf = KdfType.PBKDF2_SHA256;
      const kdfConfig = new KdfConfig(600_000);

      cryptoFunctionService.pbkdf2.mockResolvedValue(new Uint8Array(32));

      const key = await sut.deriveKeyFromPassword(password, salt, kdf, kdfConfig);

      expect(key.key.length).toEqual(32);
    });

    it("should derive a 32 byte key from a password using argon2id", async () => {
      const password = "password";
      const salt = "salt";
      const kdf = KdfType.Argon2id;
      const kdfConfig = new KdfConfig(600_000, 15);

      cryptoFunctionService.hash.mockResolvedValue(new Uint8Array(32));
      cryptoFunctionService.argon2.mockResolvedValue(new Uint8Array(32));

      const key = await sut.deriveKeyFromPassword(password, salt, kdf, kdfConfig);

      expect(key.key.length).toEqual(32);
    });
  });
});
