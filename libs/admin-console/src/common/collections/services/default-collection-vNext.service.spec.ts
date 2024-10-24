import { mock, MockProxy } from "jest-mock-extended";
import { firstValueFrom, of, Subject } from "rxjs";

import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { ContainerService } from "@bitwarden/common/platform/services/container.service";
import {
  FakeStateProvider,
  makeEncString,
  makeSymmetricCryptoKey,
  mockAccountServiceWith,
} from "@bitwarden/common/spec";
import { CollectionId, OrganizationId, UserId } from "@bitwarden/common/types/guid";
import { OrgKey } from "@bitwarden/common/types/key";

import { CollectionData } from "../models";

import { ENCRYPTED_COLLECTION_DATA_KEY } from "./collection-vNext.state";
import { DefaultCollectionvNextService } from "./default-collection-vNext.service";

describe("DefaultCollectionService", () => {
  let cryptoService: MockProxy<CryptoService>;
  let encryptService: MockProxy<EncryptService>;
  let i18nService: MockProxy<I18nService>;
  let stateProvider: FakeStateProvider;

  let userId: UserId;

  let cryptoKeys: Subject<Record<OrganizationId, OrgKey> | null>;

  let collectionService: DefaultCollectionvNextService;

  beforeEach(() => {
    userId = Utils.newGuid() as UserId;

    cryptoService = mock();
    encryptService = mock();
    i18nService = mock();
    stateProvider = new FakeStateProvider(mockAccountServiceWith(userId));

    cryptoKeys = new Subject();
    cryptoService.orgKeys$.calledWith(userId).mockReturnValue(cryptoKeys);

    // Set up mock decryption
    encryptService.decryptToUtf8
      .calledWith(expect.any(EncString), expect.any(SymmetricCryptoKey))
      .mockImplementation((encString, key) =>
        Promise.resolve(encString.data.replace("ENC_", "DEC_")),
      );

    (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);

    // Arrange i18nService so that sorting algorithm doesn't throw
    i18nService.collator = null;

    collectionService = new DefaultCollectionvNextService(
      cryptoService,
      encryptService,
      i18nService,
      stateProvider,
    );
  });

  afterEach(() => {
    delete (window as any).bitwardenContainerService;
  });

  describe("decryptedCollections$", () => {
    it("emits decrypted collections from state", async () => {
      // Arrange test data
      const org1 = Utils.newGuid() as OrganizationId;
      const orgKey1 = makeSymmetricCryptoKey<OrgKey>(64, 1);
      const collection1 = collectionDataFactory(org1);

      const org2 = Utils.newGuid() as OrganizationId;
      const orgKey2 = makeSymmetricCryptoKey<OrgKey>(64, 2);
      const collection2 = collectionDataFactory(org2);

      // Arrange dependencies
      await stateProvider.setUserState(
        ENCRYPTED_COLLECTION_DATA_KEY,
        {
          [collection1.id]: collection1,
          [collection2.id]: collection2,
        },
        userId,
      );

      cryptoKeys.next({
        [org1]: orgKey1,
        [org2]: orgKey2,
      });

      const result = await firstValueFrom(collectionService.decryptedCollections$(of(userId)));

      // Assert emitted values
      expect(result.length).toBe(2);
      expect(result).toIncludeAllPartialMembers([
        {
          id: collection1.id,
          name: "DEC_NAME_" + collection1.id,
        },
        {
          id: collection2.id,
          name: "DEC_NAME_" + collection2.id,
        },
      ]);

      // Assert that the correct org keys were used for each encrypted string
      expect(encryptService.decryptToUtf8).toHaveBeenCalledWith(
        expect.objectContaining(new EncString(collection1.name)),
        orgKey1,
      );
      expect(encryptService.decryptToUtf8).toHaveBeenCalledWith(
        expect.objectContaining(new EncString(collection2.name)),
        orgKey2,
      );
    });

    it("handles null collection state", async () => {
      // Arrange test data
      const org1 = Utils.newGuid() as OrganizationId;
      const org2 = Utils.newGuid() as OrganizationId;

      // Arrange dependencies
      await stateProvider.setUserState(ENCRYPTED_COLLECTION_DATA_KEY, null, userId);
      cryptoKeys.next({
        [org1]: makeSymmetricCryptoKey<OrgKey>(),
        [org2]: makeSymmetricCryptoKey<OrgKey>(),
      });

      const encryptedCollections = await firstValueFrom(
        collectionService.encryptedCollections$(of(userId)),
      );

      expect(encryptedCollections.length).toBe(0);
    });
  });

  describe("encryptedCollections$", () => {
    it("emits encrypted collections from state", async () => {
      // Arrange test data
      const org1 = Utils.newGuid() as OrganizationId;
      const collection1 = collectionDataFactory(org1);

      const org2 = Utils.newGuid() as OrganizationId;
      const collection2 = collectionDataFactory(org2);

      // Arrange dependencies
      await stateProvider.setUserState(
        ENCRYPTED_COLLECTION_DATA_KEY,
        {
          [collection1.id]: collection1,
          [collection2.id]: collection2,
        },
        userId,
      );

      const result = await firstValueFrom(collectionService.encryptedCollections$(of(userId)));

      expect(result.length).toBe(2);
      expect(result).toIncludeAllPartialMembers([
        {
          id: collection1.id,
          name: makeEncString("ENC_NAME_" + collection1.id),
        },
        {
          id: collection2.id,
          name: makeEncString("ENC_NAME_" + collection2.id),
        },
      ]);
    });

    it("handles null collection state", async () => {
      await stateProvider.setUserState(ENCRYPTED_COLLECTION_DATA_KEY, null, userId);

      const decryptedCollections = await firstValueFrom(
        collectionService.encryptedCollections$(of(userId)),
      );
      expect(decryptedCollections.length).toBe(0);
    });
  });

  describe("upsert", () => {
    it("upserts to existing collections", async () => {
      const org1 = Utils.newGuid() as OrganizationId;
      const collection1 = collectionDataFactory(org1);

      const org2 = Utils.newGuid() as OrganizationId;
      const collection2 = collectionDataFactory(org2);

      await stateProvider.setUserState(
        ENCRYPTED_COLLECTION_DATA_KEY,
        {
          [collection1.id]: collection1,
          [collection2.id]: collection2,
        },
        userId,
      );

      const updatedCollection1 = Object.assign(new CollectionData({} as any), collection1, {
        name: makeEncString("UPDATED_ENC_NAME_" + collection1.id).encryptedString,
      });
      const newCollection3 = collectionDataFactory(org2);

      await collectionService.upsert([updatedCollection1, newCollection3], userId);

      const result = await firstValueFrom(collectionService.encryptedCollections$(of(userId)));
      expect(result.length).toBe(3);
      expect(result).toIncludeAllPartialMembers([
        {
          id: collection1.id,
          name: makeEncString("UPDATED_ENC_NAME_" + collection1.id),
        },
        {
          id: collection2.id,
          name: makeEncString("ENC_NAME_" + collection2.id),
        },
        {
          id: newCollection3.id,
          name: makeEncString("ENC_NAME_" + newCollection3.id),
        },
      ]);
    });

    it("upserts to a null state", async () => {
      const org1 = Utils.newGuid() as OrganizationId;
      const collection1 = collectionDataFactory(org1);

      await stateProvider.setUserState(ENCRYPTED_COLLECTION_DATA_KEY, null, userId);

      await collectionService.upsert(collection1, userId);

      const result = await firstValueFrom(collectionService.encryptedCollections$(of(userId)));
      expect(result.length).toBe(1);
      expect(result).toIncludeAllPartialMembers([
        {
          id: collection1.id,
          name: makeEncString("ENC_NAME_" + collection1.id),
        },
      ]);
    });
  });
});

const collectionDataFactory = (orgId: OrganizationId) => {
  const collection = new CollectionData({} as any);
  collection.id = Utils.newGuid() as CollectionId;
  collection.organizationId = orgId;
  collection.name = makeEncString("ENC_NAME_" + collection.id).encryptedString;

  return collection;
};
