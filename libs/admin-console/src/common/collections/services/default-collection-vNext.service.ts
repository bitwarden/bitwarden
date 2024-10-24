import { combineLatest, firstValueFrom, map, Observable, of, switchMap } from "rxjs";

import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { ActiveUserState, StateProvider, DerivedState } from "@bitwarden/common/platform/state";
import { CollectionId, OrganizationId, UserId } from "@bitwarden/common/types/guid";
import { OrgKey } from "@bitwarden/common/types/key";
import { TreeNode } from "@bitwarden/common/vault/models/domain/tree-node";
import { ServiceUtils } from "@bitwarden/common/vault/service-utils";

import { CollectionvNextService } from "../abstractions/collection-vNext.service";
import { Collection, CollectionData, CollectionView } from "../models";

import {
  DECRYPTED_COLLECTION_DATA_KEY,
  ENCRYPTED_COLLECTION_DATA_KEY,
} from "./collection-vNext.state";

const NestingDelimiter = "/";

export class DefaultCollectionvNextService implements CollectionvNextService {
  /**
   * @deprecated use encryptedCollectionState instead
   */
  private activeUserEncryptedCollectionDataState: ActiveUserState<
    Record<CollectionId, CollectionData>
  >;
  /**
   * @deprecated use decryptedCollectionState instead
   */
  private activeUserDecryptedCollectionDataState: DerivedState<CollectionView[]>;

  constructor(
    private cryptoService: CryptoService,
    private encryptService: EncryptService,
    private i18nService: I18nService,
    protected stateProvider: StateProvider,
  ) {
    this.activeUserEncryptedCollectionDataState = this.stateProvider.getActive(
      ENCRYPTED_COLLECTION_DATA_KEY,
    );

    const encryptedCollectionsWithKeys =
      this.activeUserEncryptedCollectionDataState.combinedState$.pipe(
        switchMap(([userId, collectionData]) =>
          combineLatest([of(collectionData), this.cryptoService.orgKeys$(userId)]),
        ),
      );

    this.activeUserDecryptedCollectionDataState = this.stateProvider.getDerived(
      encryptedCollectionsWithKeys,
      DECRYPTED_COLLECTION_DATA_KEY,
      { collectionService: this },
    );
  }

  encryptedCollections$(userId$: Observable<UserId>) {
    return userId$.pipe(
      switchMap((userId) => this.encryptedCollectionState(userId).state$),
      map((collections) => {
        if (collections == null) {
          return [];
        }

        return Object.values(collections).map((c) => new Collection(c));
      }),
    );
  }

  decryptedCollections$(userId$: Observable<UserId>) {
    return userId$.pipe(switchMap((userId) => this.decryptedCollectionState(userId).state$));
  }

  async upsert(toUpdate: CollectionData | CollectionData[], userId: UserId): Promise<void> {
    if (toUpdate == null) {
      return;
    }
    await this.encryptedCollectionState(userId).update((collections) => {
      if (collections == null) {
        collections = {};
      }
      if (Array.isArray(toUpdate)) {
        toUpdate.forEach((c) => {
          collections[c.id] = c;
        });
      } else {
        collections[toUpdate.id] = toUpdate;
      }
      return collections;
    });
  }

  async replace(collections: Record<CollectionId, CollectionData>, userId: UserId): Promise<void> {
    await this.encryptedCollectionState(userId).update(() => collections);
  }

  async clearDecryptedState(userId: UserId): Promise<void> {
    if (userId == null) {
      throw new Error("User ID is required.");
    }

    await this.decryptedCollectionState(userId).forceValue(null);
  }

  async clear(userId: UserId): Promise<void> {
    await this.encryptedCollectionState(userId).update(() => null);
    // This will propagate from the encrypted state update, but by doing it explicitly
    // the promise doesn't resolve until the update is complete.
    await this.decryptedCollectionState(userId).forceValue(null);
  }

  async delete(id: CollectionId | CollectionId[], userId: UserId): Promise<any> {
    await this.encryptedCollectionState(userId).update((collections) => {
      if (collections == null) {
        collections = {};
      }
      if (typeof id === "string") {
        delete collections[id];
      } else {
        (id as CollectionId[]).forEach((i) => {
          delete collections[i];
        });
      }
      return collections;
    });
  }

  async encrypt(model: CollectionView): Promise<Collection> {
    if (model.organizationId == null) {
      throw new Error("Collection has no organization id.");
    }
    const key = await this.cryptoService.getOrgKey(model.organizationId);
    if (key == null) {
      throw new Error("No key for this collection's organization.");
    }
    const collection = new Collection();
    collection.id = model.id;
    collection.organizationId = model.organizationId;
    collection.readOnly = model.readOnly;
    collection.externalId = model.externalId;
    collection.name = await this.encryptService.encrypt(model.name, key);
    return collection;
  }

  // TODO: this should be private and orgKeys should be required.
  // See https://bitwarden.atlassian.net/browse/PM-12375
  async decryptMany(
    collections: Collection[],
    orgKeys?: Record<OrganizationId, OrgKey>,
  ): Promise<CollectionView[]> {
    if (collections == null || collections.length === 0) {
      return [];
    }
    const decCollections: CollectionView[] = [];

    orgKeys ??= await firstValueFrom(this.cryptoService.activeUserOrgKeys$);

    const promises: Promise<any>[] = [];
    collections.forEach((collection) => {
      promises.push(
        collection
          .decrypt(orgKeys[collection.organizationId as OrganizationId])
          .then((c) => decCollections.push(c)),
      );
    });
    await Promise.all(promises);
    return decCollections.sort(Utils.getSortFunction(this.i18nService, "name"));
  }

  getAllNested(collections: CollectionView[]): TreeNode<CollectionView>[] {
    const nodes: TreeNode<CollectionView>[] = [];
    collections.forEach((c) => {
      const collectionCopy = new CollectionView();
      collectionCopy.id = c.id;
      collectionCopy.organizationId = c.organizationId;
      const parts = c.name != null ? c.name.replace(/^\/+|\/+$/g, "").split(NestingDelimiter) : [];
      ServiceUtils.nestedTraverse(nodes, 0, parts, collectionCopy, null, NestingDelimiter);
    });
    return nodes;
  }

  /**
   * @deprecated August 30 2022: Moved to new Vault Filter Service
   * Remove when Desktop and Browser are updated
   */
  getNested(collections: CollectionView[], id: string): TreeNode<CollectionView> {
    const nestedCollections = this.getAllNested(collections);
    return ServiceUtils.getTreeNodeObjectFromList(
      nestedCollections,
      id,
    ) as TreeNode<CollectionView>;
  }

  /**
   * @returns a SingleUserState for encrypted collection data.
   */
  private encryptedCollectionState(userId: UserId) {
    return this.stateProvider.getUser(userId, ENCRYPTED_COLLECTION_DATA_KEY);
  }

  /**
   * @returns a SingleUserState for decrypted collection data.
   */
  private decryptedCollectionState(userId: UserId): DerivedState<CollectionView[]> {
    const encryptedCollectionsWithKeys = this.encryptedCollectionState(userId).combinedState$.pipe(
      switchMap(([userId, collectionData]) =>
        combineLatest([of(collectionData), this.cryptoService.orgKeys$(userId)]),
      ),
    );

    return this.stateProvider.getDerived(
      encryptedCollectionsWithKeys,
      DECRYPTED_COLLECTION_DATA_KEY,
      {
        collectionService: this,
      },
    );
  }
}
