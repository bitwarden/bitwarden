import { Injectable } from "@angular/core";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
} from "rxjs";

import { DynamicTreeNode } from "@bitwarden/angular/vault/vault-filter/models/dynamic-tree-node.model";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { TreeNode } from "@bitwarden/common/vault/models/domain/tree-node";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";
import { ServiceUtils } from "@bitwarden/common/vault/service-utils";

export type PopupListFilter = {
  organizationId: string | null;
  collectionId: string | null;
  folderId: string | null;
  cipherType: CipherType | null;
};

/** All cipher types */
const allCipherTypes: { value: CipherType; label: string; icon: string }[] = [
  {
    value: CipherType.Login,
    label: "logins",
    icon: "bwi-globe",
  },
  {
    value: CipherType.Card,
    label: "cards",
    icon: "bwi-credit-card",
  },
  {
    value: CipherType.Identity,
    label: "identities",
    icon: "bwi-id-card",
  },
  {
    value: CipherType.SecureNote,
    label: "notes",
    icon: "bwi-sticky-note",
  },
];

/** Delimiter that denotes a level of nesting  */
const NestingDelimiter = "/";

const MyVaultId = "MyVault";

@Injectable({
  providedIn: "root",
})
export class VaultPopupListFiltersService {
  private _filters$ = new BehaviorSubject<PopupListFilter>({
    organizationId: null,
    collectionId: null,
    cipherType: null,
    folderId: null,
  });
  filters$ = this._filters$.asObservable();

  constructor(
    private vaultSettingsService: VaultSettingsService,
    private folderService: FolderService,
    private cipherService: CipherService,
    private organizationService: OrganizationService,
    private i18nService: I18nService,
    private collectionService: CollectionService,
  ) {}

  updateFilter(filter: Partial<PopupListFilter>): void {
    this._filters$.next({
      ...this._filters$.value,
      ...filter,
    });
  }

  filterCiphers = (ciphers: CipherView[], filters: PopupListFilter): CipherView[] => {
    return ciphers.filter((cipher) => {
      let satisfiesFilter = true;

      if (filters.cipherType !== null && cipher.type !== filters.cipherType) {
        satisfiesFilter = satisfiesFilter && false;
      }

      if (
        filters.organizationId === MyVaultId &&
        cipher.organizationId !== null &&
        filters.organizationId !== null &&
        filters.organizationId !== MyVaultId &&
        cipher.organizationId !== filters.organizationId
      ) {
        satisfiesFilter = satisfiesFilter && false;
      }

      if (filters.collectionId !== null && !cipher.collectionIds.includes(filters.collectionId)) {
        satisfiesFilter = satisfiesFilter && false;
      }

      if (filters.folderId !== null && cipher.folderId !== filters.folderId) {
        satisfiesFilter = satisfiesFilter && false;
      }
      return satisfiesFilter;
    });
  };

  /** Available cipher types */
  cipherTypes$ = combineLatest([
    this.vaultSettingsService.showCardsCurrentTab$,
    this.vaultSettingsService.showIdentitiesCurrentTab$,
  ]).pipe(
    map(([showCards, showIdentities]) => {
      // Filter out cipher types that are not enabled within the user's settings
      return allCipherTypes.filter((cipherType) => {
        if (cipherType.value === CipherType.Card) {
          return showCards;
        }
        if (cipherType.value === CipherType.Identity) {
          return showIdentities;
        }
        return true;
      });
    }),
  );

  organizations$ = this.organizationService.memberOrganizations$.pipe(
    map((orgs) => orgs.sort(Utils.getSortFunction(this.i18nService, "name"))),
    map((orgs) => {
      // When the user is a member of an organization, make  the "My Vault" option available
      if (orgs.length) {
        return [
          {
            id: MyVaultId,
            name: this.i18nService.t("myVault"),
          },
          ...orgs,
        ];
      }
      return orgs;
    }),
  );

  folders$: Observable<DynamicTreeNode<FolderView>> = combineLatest([
    this.filters$.pipe(
      distinctUntilChanged(
        (previousFilter, currentFilter) =>
          previousFilter?.organizationId === currentFilter?.organizationId,
      ),
    ),
    this.folderService.folderViews$,
    this.cipherService.cipherViews$,
  ]).pipe(
    map(([filters, folders, ciphers]) => {
      const organizationId = filters.organizationId;

      if (organizationId === null || organizationId === MyVaultId) {
        return folders;
      }

      const cipherViews = Object.values(ciphers);
      const orgCiphers = cipherViews.filter((c) => c.organizationId === organizationId);
      return folders.filter((f) => orgCiphers.some((oc) => oc.folderId === f.id) || f.id === null);
    }),
    map((folders) => {
      const nestedFolders = this.getAllFoldersNested(folders);
      return new DynamicTreeNode<FolderView>({
        fullList: folders,
        nestedList: nestedFolders,
      });
    }),
  );

  collections$: Observable<DynamicTreeNode<CollectionView>> = this.filters$.pipe(
    distinctUntilChanged(
      // Only update the collections when the organizationId filter changes
      (previousFilter, currentFilter) =>
        previousFilter?.organizationId === currentFilter?.organizationId,
    ),
    switchMap(async (filters) => {
      const organizationId = filters.organizationId;

      // Get all stored collections
      const allCollections = await this.collectionService.getAllDecrypted();

      // When the organization filter is selected, filter out collections that do not belong to the selected organization
      const collections =
        organizationId === null
          ? allCollections
          : allCollections.filter((c) => c.organizationId === organizationId);

      return collections;
    }),
    switchMap(async (collections) => {
      const nestedCollections = await this.collectionService.getAllNested(collections);

      return new DynamicTreeNode<CollectionView>({
        fullList: collections,
        nestedList: nestedCollections,
      });
    }),
  );

  private getAllFoldersNested(folders: FolderView[]): TreeNode<FolderView>[] {
    const nodes: TreeNode<FolderView>[] = [];

    folders.forEach((f) => {
      const folderCopy = new FolderView();
      folderCopy.id = f.id;
      folderCopy.revisionDate = f.revisionDate;

      // Remove "/" from beginning and end of the folder name
      // then split the folder name by the delimiter
      const parts = f.name != null ? f.name.replace(/^\/+|\/+$/g, "").split(NestingDelimiter) : [];
      ServiceUtils.nestedTraverse(nodes, 0, parts, folderCopy, null, NestingDelimiter);
    });

    return nodes;
  }
}
