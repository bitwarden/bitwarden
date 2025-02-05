import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { BehaviorSubject, skipWhile, take } from "rxjs";

import { CollectionService, CollectionView } from "@bitwarden/admin-console/common";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ProductTierType } from "@bitwarden/common/billing/enums";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { mockAccountServiceWith } from "@bitwarden/common/spec";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";

import { PopupViewCacheService } from "../../../platform/popup/view-cache/popup-view-cache.service";

import {
  CachedFilterState,
  MY_VAULT_ID,
  VaultPopupListFiltersService,
} from "./vault-popup-list-filters.service";

describe("VaultPopupListFiltersService", () => {
  let service: VaultPopupListFiltersService;
  const _memberOrganizations$ = new BehaviorSubject<Organization[]>([]);
  const memberOrganizations$ = (userId: UserId) => _memberOrganizations$;
  const organizations$ = new BehaviorSubject<Organization[]>([]);
  const folderViews$ = new BehaviorSubject([]);
  const cipherViews$ = new BehaviorSubject({});
  const decryptedCollections$ = new BehaviorSubject<CollectionView[]>([]);
  const policyAppliesToActiveUser$ = new BehaviorSubject<boolean>(false);
  let viewCacheService: {
    signal: jest.Mock;
    mockSignal: BehaviorSubject<CachedFilterState>;
  };

  const collectionService = {
    decryptedCollections$,
    getAllNested: () => Promise.resolve([]),
  } as unknown as CollectionService;

  const folderService = {
    folderViews$: () => folderViews$,
  } as unknown as FolderService;

  const cipherService = {
    cipherViews$,
  } as unknown as CipherService;

  const organizationService = {
    memberOrganizations$,
    organizations$,
  } as unknown as OrganizationService;

  const i18nService = {
    t: (key: string) => key,
  } as I18nService;

  const policyService = {
    policyAppliesToActiveUser$: jest.fn(() => policyAppliesToActiveUser$),
  };

  const state$ = new BehaviorSubject<boolean>(false);
  const update = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    _memberOrganizations$.next([]);
    decryptedCollections$.next([]);
    policyAppliesToActiveUser$.next(false);
    policyService.policyAppliesToActiveUser$.mockClear();

    const accountService = mockAccountServiceWith("userId" as UserId);

    viewCacheService = {
      mockSignal: new BehaviorSubject<CachedFilterState>({}),
      signal: jest.fn(() => ({
        set: (value: CachedFilterState) => viewCacheService.mockSignal.next(value),
      })),
    };

    collectionService.getAllNested = () => Promise.resolve([]);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FolderService,
          useValue: folderService,
        },
        {
          provide: CipherService,
          useValue: cipherService,
        },
        {
          provide: OrganizationService,
          useValue: organizationService,
        },
        {
          provide: I18nService,
          useValue: i18nService,
        },
        {
          provide: CollectionService,
          useValue: collectionService,
        },
        {
          provide: PolicyService,
          useValue: policyService,
        },
        {
          provide: StateProvider,
          useValue: { getGlobal: () => ({ state$, update }) },
        },
        { provide: FormBuilder, useClass: FormBuilder },
        {
          provide: AccountService,
          useValue: accountService,
        },
        {
          provide: PopupViewCacheService,
          useValue: viewCacheService,
        },
      ],
    });

    service = TestBed.inject(VaultPopupListFiltersService);
  });

  describe("cipherTypes", () => {
    it("returns all cipher types", () => {
      expect(service.cipherTypes.map((c) => c.value)).toEqual([
        CipherType.Login,
        CipherType.Card,
        CipherType.Identity,
        CipherType.SecureNote,
        CipherType.SshKey,
      ]);
    });
  });

  describe("numberOfAppliedFilters$", () => {
    it("updates as the form value changes", (done) => {
      service.numberOfAppliedFilters$.subscribe((number) => {
        expect(number).toBe(2);
        done();
      });

      service.filterForm.patchValue({
        organization: { id: "1234" } as Organization,
        folder: { id: "folder11" } as FolderView,
      });
    });
  });

  describe("organizations$", () => {
    it('does not add "myVault" to the list of organizations when there are no organizations', (done) => {
      _memberOrganizations$.next([]);

      service.organizations$.subscribe((organizations) => {
        expect(organizations.map((o) => o.label)).toEqual([]);
        done();
      });
    });

    it('adds "myVault" to the list of organizations when there are other organizations', (done) => {
      const orgs = [{ name: "bobby's org", id: "1234-3323-23223" }] as Organization[];
      _memberOrganizations$.next(orgs);

      service.organizations$.subscribe((organizations) => {
        expect(organizations.map((o) => o.label)).toEqual(["myVault", "bobby's org"]);
        done();
      });
    });

    it("sorts organizations by name", (done) => {
      const orgs = [
        { name: "bobby's org", id: "1234-3323-23223" },
        { name: "alice's org", id: "2223-4343-99888" },
      ] as Organization[];
      _memberOrganizations$.next(orgs);

      service.organizations$.subscribe((organizations) => {
        expect(organizations.map((o) => o.label)).toEqual([
          "myVault",
          "alice's org",
          "bobby's org",
        ]);
        done();
      });
    });

    describe("PersonalOwnership policy", () => {
      it('calls policyAppliesToActiveUser$ with "PersonalOwnership"', () => {
        expect(policyService.policyAppliesToActiveUser$).toHaveBeenCalledWith(
          PolicyType.PersonalOwnership,
        );
      });

      it("returns an empty array when the policy applies and there is a single organization", (done) => {
        policyAppliesToActiveUser$.next(true);
        _memberOrganizations$.next([
          { name: "bobby's org", id: "1234-3323-23223" },
        ] as Organization[]);

        service.organizations$.subscribe((organizations) => {
          expect(organizations).toEqual([]);
          done();
        });
      });

      it('adds "myVault" when the policy does not apply and there are multiple organizations', (done) => {
        policyAppliesToActiveUser$.next(false);
        const orgs = [
          { name: "bobby's org", id: "1234-3323-23223" },
          { name: "alice's org", id: "2223-4343-99888" },
        ] as Organization[];

        _memberOrganizations$.next(orgs);

        service.organizations$.subscribe((organizations) => {
          expect(organizations.map((o) => o.label)).toEqual([
            "myVault",
            "alice's org",
            "bobby's org",
          ]);
          done();
        });
      });

      it('does not add "myVault" the policy applies and there are multiple organizations', (done) => {
        policyAppliesToActiveUser$.next(true);
        const orgs = [
          { name: "bobby's org", id: "1234-3323-23223" },
          { name: "alice's org", id: "2223-3242-99888" },
          { name: "catherine's org", id: "77733-4343-99888" },
        ] as Organization[];

        _memberOrganizations$.next(orgs);

        service.organizations$.subscribe((organizations) => {
          expect(organizations.map((o) => o.label)).toEqual([
            "alice's org",
            "bobby's org",
            "catherine's org",
          ]);
          done();
        });
      });
    });

    describe("icons", () => {
      it("sets family icon for family organizations", (done) => {
        const orgs = [
          {
            name: "family org",
            id: "1234-3323-23223",
            enabled: true,
            productTierType: ProductTierType.Families,
          },
        ] as Organization[];

        _memberOrganizations$.next(orgs);

        service.organizations$.subscribe((organizations) => {
          expect(organizations.map((o) => o.icon)).toEqual(["bwi-user", "bwi-family"]);
          done();
        });
      });

      it("sets family icon for free organizations", (done) => {
        const orgs = [
          {
            name: "free org",
            id: "1234-3323-23223",
            enabled: true,
            productTierType: ProductTierType.Free,
          },
        ] as Organization[];

        _memberOrganizations$.next(orgs);

        service.organizations$.subscribe((organizations) => {
          expect(organizations.map((o) => o.icon)).toEqual(["bwi-user", "bwi-family"]);
          done();
        });
      });

      it("sets warning icon for disabled organizations", (done) => {
        const orgs = [
          {
            name: "free org",
            id: "1234-3323-23223",
            enabled: false,
            productTierType: ProductTierType.Free,
          },
        ] as Organization[];

        _memberOrganizations$.next(orgs);

        service.organizations$.subscribe((organizations) => {
          expect(organizations.map((o) => o.icon)).toEqual([
            "bwi-user",
            "bwi-exclamation-triangle tw-text-danger",
          ]);
          done();
        });
      });
    });
  });

  describe("collections$", () => {
    const testCollection = {
      id: "14cbf8e9-7a2a-4105-9bf6-b15c01203cef",
      name: "Test collection",
      organizationId: "3f860945-b237-40bc-a51e-b15c01203ccf",
    } as CollectionView;

    const testCollection2 = {
      id: "b15c0120-7a2a-4105-9bf6-b15c01203ceg",
      name: "Test collection 2",
      organizationId: "1203ccf-2432-123-acdd-b15c01203ccf",
    } as CollectionView;

    const testCollections = [testCollection, testCollection2];

    beforeEach(() => {
      decryptedCollections$.next(testCollections);

      collectionService.getAllNested = () =>
        Promise.resolve(
          testCollections.map((c) => ({
            children: [],
            node: c,
            parent: null,
          })),
        );
    });

    it("returns all collections", (done) => {
      service.collections$.subscribe((collections) => {
        expect(collections.map((c) => c.label)).toEqual(["Test collection", "Test collection 2"]);
        done();
      });
    });

    it("filters out collections that do not belong to an organization", () => {
      service.filterForm.patchValue({
        organization: { id: testCollection2.organizationId } as Organization,
      });

      service.collections$.subscribe((collections) => {
        expect(collections.map((c) => c.label)).toEqual(["Test collection 2"]);
      });
    });

    it("sets collection icon", (done) => {
      service.collections$.subscribe((collections) => {
        expect(collections.every(({ icon }) => icon === "bwi-collection")).toBeTruthy();
        done();
      });
    });
  });

  describe("folders$", () => {
    it('returns no folders when "No Folder" is the only option', (done) => {
      folderViews$.next([{ id: null, name: "No Folder" }]);

      service.folders$.subscribe((folders) => {
        expect(folders).toEqual([]);
        done();
      });
    });

    it('moves "No Folder" to the end of the list', (done) => {
      folderViews$.next([
        { id: null, name: "No Folder" },
        { id: "2345", name: "Folder 2" },
        { id: "1234", name: "Folder 1" },
      ]);

      service.folders$.subscribe((folders) => {
        expect(folders.map((f) => f.label)).toEqual(["Folder 1", "Folder 2", "itemsWithNoFolder"]);
        done();
      });
    });

    it("returns all folders when MyVault is selected", (done) => {
      service.filterForm.patchValue({
        organization: { id: MY_VAULT_ID } as Organization,
      });

      folderViews$.next([
        { id: "1234", name: "Folder 1" },
        { id: "2345", name: "Folder 2" },
      ]);

      service.folders$.subscribe((folders) => {
        expect(folders.map((f) => f.label)).toEqual(["Folder 1", "Folder 2"]);
        done();
      });
    });

    it("sets folder icon", (done) => {
      service.filterForm.patchValue({
        organization: { id: MY_VAULT_ID } as Organization,
      });

      folderViews$.next([
        { id: "1234", name: "Folder 1" },
        { id: "2345", name: "Folder 2" },
      ]);

      service.folders$.subscribe((folders) => {
        expect(folders.every(({ icon }) => icon === "bwi-folder")).toBeTruthy();
        done();
      });
    });

    it("returns folders that have ciphers within the selected organization", (done) => {
      service.folders$.pipe(skipWhile((folders) => folders.length === 2)).subscribe((folders) => {
        expect(folders.map((f) => f.label)).toEqual(["Folder 1"]);
        done();
      });

      service.filterForm.patchValue({
        organization: { id: "1234" } as Organization,
      });

      folderViews$.next([
        { id: "1234", name: "Folder 1" },
        { id: "2345", name: "Folder 2" },
      ]);

      cipherViews$.next({
        "1": { folderId: "1234", organizationId: "1234" },
        "2": { folderId: "2345", organizationId: "56789" },
      });
    });
  });

  describe("filterFunction$", () => {
    const ciphers = [
      { type: CipherType.Login, collectionIds: [], organizationId: null },
      { type: CipherType.Card, collectionIds: ["1234"], organizationId: "8978" },
      { type: CipherType.Identity, collectionIds: [], folderId: "5432", organizationId: null },
      { type: CipherType.SecureNote, collectionIds: [], organizationId: null },
    ] as CipherView[];

    it("filters by cipherType", (done) => {
      service.filterFunction$.subscribe((filterFunction) => {
        expect(filterFunction(ciphers)).toEqual([ciphers[0]]);
        done();
      });

      service.filterForm.patchValue({ cipherType: CipherType.Login });
    });

    it("filters by collection", (done) => {
      const collection = { id: "1234" } as CollectionView;

      service.filterFunction$.subscribe((filterFunction) => {
        expect(filterFunction(ciphers)).toEqual([ciphers[1]]);
        done();
      });

      service.filterForm.patchValue({ collection });
    });

    it("filters by folder", (done) => {
      const folder = { id: "5432" } as FolderView;

      service.filterFunction$.subscribe((filterFunction) => {
        expect(filterFunction(ciphers)).toEqual([ciphers[2]]);
        done();
      });

      service.filterForm.patchValue({ folder });
    });

    describe("organizationId", () => {
      it("filters out ciphers that belong to an organization when MyVault is selected", (done) => {
        const organization = { id: MY_VAULT_ID } as Organization;

        service.filterFunction$.subscribe((filterFunction) => {
          expect(filterFunction(ciphers)).toEqual([ciphers[0], ciphers[2], ciphers[3]]);
          done();
        });

        service.filterForm.patchValue({ organization });
      });

      it("filters out ciphers that do not belong to the selected organization", (done) => {
        const organization = { id: "8978" } as Organization;

        service.filterFunction$.subscribe((filterFunction) => {
          expect(filterFunction(ciphers)).toEqual([ciphers[1]]);
          done();
        });

        service.filterForm.patchValue({ organization });
      });
    });
  });

  describe("filterVisibilityState", () => {
    it("exposes stored state through filterVisibilityState$", (done) => {
      state$.next(true);

      service.filterVisibilityState$.subscribe((filterVisibility) => {
        expect(filterVisibility).toBe(true);
        done();
      });
    });

    it("updates stored filter state", async () => {
      await service.updateFilterVisibility(false);

      expect(update).toHaveBeenCalledTimes(1);
      // Get callback passed to `update`
      const updateCallback = update.mock.calls[0][0];
      expect(updateCallback()).toBe(false);
    });
  });

  describe("caching", () => {
    it("initializes form from cached state", fakeAsync(() => {
      const cachedState: CachedFilterState = {
        organizationId: MY_VAULT_ID,
        collectionId: "test-collection-id",
        folderId: "test-folder-id",
        cipherType: CipherType.Login,
      };

      // Setup mock organizations and collections
      _memberOrganizations$.next([{ id: MY_VAULT_ID } as Organization]);
      decryptedCollections$.next([{ id: "test-collection-id" } as CollectionView]);
      folderViews$.next([{ id: "test-folder-id" } as FolderView]);

      // Simulate cached state
      viewCacheService.mockSignal.next(cachedState);
      service = TestBed.inject(VaultPopupListFiltersService);
      tick(); // Allow async operations to complete

      expect(service.filterForm.value).toEqual({
        organization: { id: MY_VAULT_ID },
        collection: { id: "test-collection-id" },
        folder: { id: "test-folder-id" },
        cipherType: CipherType.Login,
      });
    }));

    it("serializes filters to cache on changes", fakeAsync(() => {
      const testOrg = { id: "test-org-id" } as Organization;
      const testCollection = { id: "test-collection-id" } as CollectionView;
      const testFolder = { id: "test-folder-id" } as FolderView;

      service.filterForm.patchValue({
        organization: testOrg,
        collection: testCollection,
        folder: testFolder,
        cipherType: CipherType.Card,
      });
      tick(300); // Wait for debounce

      expect(viewCacheService.mockSignal.value).toEqual({
        organizationId: "test-org-id",
        collectionId: "test-collection-id",
        folderId: "test-folder-id",
        cipherType: CipherType.Card,
      });
    }));

    it("handles invalid cached IDs", fakeAsync(() => {
      const cachedState: CachedFilterState = {
        organizationId: "invalid-org-id",
        collectionId: "invalid-collection-id",
        folderId: "invalid-folder-id",
      };

      // Setup empty data
      _memberOrganizations$.next([]);
      decryptedCollections$.next([]);
      folderViews$.next([]);

      viewCacheService.mockSignal.next(cachedState);
      service = TestBed.inject(VaultPopupListFiltersService);
      tick();

      expect(service.filterForm.value).toEqual({
        organization: null,
        collection: null,
        folder: null,
        cipherType: null,
      });
    }));
  });

  describe("serializeFilters", () => {
    it("correctly extracts IDs from form values", () => {
      service.filterForm.patchValue({
        organization: { id: "org-id" } as Organization,
        collection: { id: "col-id" } as CollectionView,
        folder: { id: "folder-id" } as FolderView,
        cipherType: CipherType.Identity,
      });

      expect(service.serializeFilters()).toEqual({
        organizationId: "org-id",
        collectionId: "col-id",
        folderId: "folder-id",
        cipherType: CipherType.Identity,
      });
    });

    it("handles null values", () => {
      service.filterForm.reset();
      expect(service.serializeFilters()).toEqual({
        organizationId: undefined,
        collectionId: undefined,
        folderId: undefined,
        cipherType: undefined,
      });
    });
  });

  describe("filter initialization", () => {
    it("applies cached filters to cipher list on startup", fakeAsync(() => {
      const ciphers = [
        { id: "1", organizationId: "test-org", collectionIds: ["test-collection"] },
        { id: "2", organizationId: "other-org" },
      ] as CipherView[];

      // Setup cached filters
      viewCacheService.mockSignal.next({
        organizationId: "test-org",
        collectionId: "test-collection",
      });

      // Setup test data
      _memberOrganizations$.next([{ id: "test-org" } as Organization]);
      decryptedCollections$.next([
        { id: "test-collection", organizationId: "test-org" } as CollectionView,
      ]);
      cipherViews$.next(ciphers);

      service = TestBed.inject(VaultPopupListFiltersService);

      let filteredCiphers: CipherView[];
      service.filterFunction$.pipe(take(1)).subscribe((fn) => {
        filteredCiphers = fn(ciphers);
      });
      tick();

      expect(filteredCiphers).toEqual([ciphers[0]]);
    }));
  });
});
