import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { mock } from "jest-mock-extended";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CipherAuthorizationService } from "@bitwarden/common/vault/services/cipher-authorization.service";
import { DialogService, ToastService } from "@bitwarden/components";

import { ViewCipherDialogParams, ViewCipherDialogResult, ViewComponent } from "./view.component";

describe("ViewComponent", () => {
  let component: ViewComponent;
  let fixture: ComponentFixture<ViewComponent>;

  const mockCipher: CipherView = {
    id: "cipher-id",
    type: 1,
    organizationId: "org-id",
    isDeleted: false,
  } as CipherView;

  const mockOrganization: Organization = {
    id: "org-id",
    name: "Test Organization",
  } as Organization;

  const mockParams: ViewCipherDialogParams = {
    cipher: mockCipher,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: mockParams },
        { provide: DialogRef, useValue: mock<DialogRef>() },
        { provide: I18nService, useValue: { t: jest.fn().mockReturnValue("login") } },
        { provide: DialogService, useValue: mock<DialogService>() },
        { provide: CipherService, useValue: mock<CipherService>() },
        { provide: ToastService, useValue: mock<ToastService>() },
        { provide: MessagingService, useValue: mock<MessagingService>() },
        { provide: LogService, useValue: mock<LogService>() },
        {
          provide: OrganizationService,
          useValue: { get: jest.fn().mockResolvedValue(mockOrganization) },
        },
        { provide: CollectionService, useValue: mock<CollectionService>() },
        { provide: FolderService, useValue: mock<FolderService>() },
        { provide: CryptoService, useValue: mock<CryptoService>() },
        {
          provide: BillingAccountProfileStateService,
          useValue: mock<BillingAccountProfileStateService>(),
        },
        { provide: ConfigService, useValue: mock<ConfigService>() },
        {
          provide: CipherAuthorizationService,
          useValue: {
            canDeleteCipher$: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewComponent);
    component = fixture.componentInstance;
    component.params = mockParams;
    component.cipher = mockCipher;
  });

  describe("ngOnInit", () => {
    it("initializes the component with cipher and organization", async () => {
      await component.ngOnInit();

      expect(component.cipher).toEqual(mockCipher);
      expect(component.organization).toEqual(mockOrganization);
    });
  });

  describe("edit", () => {
    it("closes the dialog with the proper arguments", async () => {
      const dialogRefCloseSpy = jest.spyOn(component["dialogRef"], "close");

      await component.edit();

      expect(dialogRefCloseSpy).toHaveBeenCalledWith({ action: ViewCipherDialogResult.Edited });
    });
  });

  describe("delete", () => {
    it("calls the delete method on delete and closes the dialog with the proper arguments", async () => {
      const deleteSpy = jest.spyOn(component, "delete");
      const dialogRefCloseSpy = jest.spyOn(component["dialogRef"], "close");
      jest.spyOn(component["dialogService"], "openSimpleDialog").mockResolvedValue(true);

      await component.delete();

      expect(deleteSpy).toHaveBeenCalled();
      expect(dialogRefCloseSpy).toHaveBeenCalledWith({ action: ViewCipherDialogResult.Deleted });
    });
  });
});
