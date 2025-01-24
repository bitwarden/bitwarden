import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { mock } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom, of } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { IconComponent } from "@bitwarden/angular/vault/components/icon.component";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AutofillSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { ToastService } from "@bitwarden/components";
import {
  PasswordRepromptService,
  SecurityTask,
  SecurityTaskType,
  TaskService,
} from "@bitwarden/vault";

import { PopupHeaderComponent } from "../../../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../../../platform/popup/layout/popup-page.component";

import { AtRiskPasswordsComponent } from "./at-risk-passwords.component";

@Component({
  standalone: true,
  selector: "popup-header",
  template: `<ng-content></ng-content>`,
})
class MockPopupHeaderComponent {
  @Input() pageTitle: string | undefined;
  @Input() backAction: (() => void) | undefined;
}

@Component({
  standalone: true,
  selector: "popup-page",
  template: `<ng-content></ng-content>`,
})
class MockPopupPageComponent {
  @Input() loading: boolean | undefined;
}

@Component({
  standalone: true,
  selector: "app-vault-icon",
  template: `<ng-content></ng-content>`,
})
class MockAppIcon {
  @Input() cipher: CipherView | undefined;
}

describe("AtRiskPasswordsComponent", () => {
  let component: AtRiskPasswordsComponent;
  let fixture: ComponentFixture<AtRiskPasswordsComponent>;

  let mockTasks$: BehaviorSubject<SecurityTask[]>;
  let mockCiphers$: BehaviorSubject<CipherView[]>;
  let mockOrg$: BehaviorSubject<Organization>;
  let mockAutofillOnPageLoad$: BehaviorSubject<boolean>;
  const setAutofillOnPageLoad = jest.fn();
  const mockToastService = mock<ToastService>();

  beforeEach(async () => {
    mockTasks$ = new BehaviorSubject<SecurityTask[]>([
      {
        id: "task",
        organizationId: "org",
        cipherId: "cipher",
        type: SecurityTaskType.UpdateAtRiskCredential,
      } as SecurityTask,
    ]);
    mockCiphers$ = new BehaviorSubject<CipherView[]>([
      {
        id: "cipher",
        organizationId: "org",
        name: "Item 1",
      } as CipherView,
      {
        id: "cipher2",
        organizationId: "org",
        name: "Item 2",
      } as CipherView,
    ]);
    mockOrg$ = new BehaviorSubject<Organization>({
      id: "org",
      name: "Org 1",
    } as Organization);

    mockAutofillOnPageLoad$ = new BehaviorSubject<boolean>(false);
    setAutofillOnPageLoad.mockClear();
    mockToastService.showToast.mockClear();

    await TestBed.configureTestingModule({
      imports: [AtRiskPasswordsComponent],
      providers: [
        {
          provide: TaskService,
          useValue: {
            pendingTasks$: () => mockTasks$,
          },
        },
        {
          provide: OrganizationService,
          useValue: {
            get$: () => mockOrg$,
          },
        },
        {
          provide: CipherService,
          useValue: {
            cipherViews$: mockCiphers$,
          },
        },
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: AccountService, useValue: { activeAccount$: of({ id: "user" }) } },
        { provide: PlatformUtilsService, useValue: mock<PlatformUtilsService>() },
        { provide: PasswordRepromptService, useValue: mock<PasswordRepromptService>() },
        {
          provide: AutofillSettingsServiceAbstraction,
          useValue: {
            autofillOnPageLoad$: mockAutofillOnPageLoad$,
            setAutofillOnPageLoad,
          },
        },
        { provide: ToastService, useValue: mockToastService },
      ],
    })
      .overrideModule(JslibModule, {
        remove: {
          imports: [IconComponent],
          exports: [IconComponent],
        },
        add: {
          imports: [MockAppIcon],
          exports: [MockAppIcon],
        },
      })
      .overrideComponent(AtRiskPasswordsComponent, {
        remove: {
          imports: [PopupHeaderComponent, PopupPageComponent],
        },
        add: {
          imports: [MockPopupHeaderComponent, MockPopupPageComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AtRiskPasswordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("pending atRiskItems$", () => {
    it("should list pending at risk item tasks", async () => {
      const items = await firstValueFrom(component["atRiskItems$"]);
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Item 1");
    });
  });

  describe("pageDescription$", () => {
    it("should use single org description when tasks belong to one org", async () => {
      const description = await firstValueFrom(component["pageDescription$"]);
      expect(description).toBe("atRiskPasswordsDescSingleOrg");
    });

    it("should use multiple org description when tasks belong to multiple orgs", async () => {
      mockTasks$.next([
        {
          id: "task",
          organizationId: "org",
          cipherId: "cipher",
          type: SecurityTaskType.UpdateAtRiskCredential,
        } as SecurityTask,
        {
          id: "task2",
          organizationId: "org2",
          cipherId: "cipher2",
          type: SecurityTaskType.UpdateAtRiskCredential,
        } as SecurityTask,
      ]);
      const description = await firstValueFrom(component["pageDescription$"]);
      expect(description).toBe("atRiskPasswordsDescMultiOrg");
    });
  });

  describe("autofill callout", () => {
    it("should show the callout if autofill is disabled", async () => {
      mockAutofillOnPageLoad$.next(false);
      fixture.detectChanges();
      const callout = fixture.debugElement.query(By.css('[data-testid="autofill-callout"]'));

      expect(callout).toBeTruthy();
    });

    it("should hide the callout if autofill is enabled", async () => {
      mockAutofillOnPageLoad$.next(true);
      fixture.detectChanges();
      const callout = fixture.debugElement.query(By.css('[data-testid="autofill-callout"]'));

      expect(callout).toBeFalsy();
    });

    describe("turn on autofill button", () => {
      it("should call the service to turn on autofill and show a toast", () => {
        const button = fixture.debugElement.query(
          By.css('[data-testid="turn-on-autofill-button"]'),
        );
        button.nativeElement.click();

        expect(setAutofillOnPageLoad).toHaveBeenCalledWith(true);
        expect(mockToastService.showToast).toHaveBeenCalled();
      });
    });
  });
});
