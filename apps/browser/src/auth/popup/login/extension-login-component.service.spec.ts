import { TestBed } from "@angular/core/testing";
import { MockProxy, mock } from "jest-mock-extended";

import { DefaultLoginComponentService } from "@bitwarden/auth/angular";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/generator-legacy";

import { flagEnabled } from "../../../platform/flags";
import { BrowserPlatformUtilsService } from "../../../platform/services/platform-utils/browser-platform-utils.service";

import { ExtensionLoginComponentService } from "./extension-login-component.service";

jest.mock("../../../platform/flags", () => ({
  flagEnabled: jest.fn(),
}));

describe("ExtensionLoginComponentService", () => {
  let service: ExtensionLoginComponentService;
  let cryptoFunctionService: MockProxy<CryptoFunctionService>;
  let environmentService: MockProxy<EnvironmentService>;
  let passwordGenerationService: MockProxy<PasswordGenerationServiceAbstraction>;
  let platformUtilsService: MockProxy<BrowserPlatformUtilsService>;
  let ssoLoginService: MockProxy<SsoLoginServiceAbstraction>;

  beforeEach(() => {
    cryptoFunctionService = mock<CryptoFunctionService>();
    environmentService = mock<EnvironmentService>();
    passwordGenerationService = mock<PasswordGenerationServiceAbstraction>();
    platformUtilsService = mock<BrowserPlatformUtilsService>();
    ssoLoginService = mock<SsoLoginServiceAbstraction>();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExtensionLoginComponentService,
          useFactory: () =>
            new ExtensionLoginComponentService(
              cryptoFunctionService,
              environmentService,
              passwordGenerationService,
              platformUtilsService,
              ssoLoginService,
            ),
        },
        { provide: DefaultLoginComponentService, useExisting: ExtensionLoginComponentService },
        { provide: CryptoFunctionService, useValue: cryptoFunctionService },
        { provide: EnvironmentService, useValue: environmentService },
        { provide: PasswordGenerationServiceAbstraction, useValue: passwordGenerationService },
        { provide: PlatformUtilsService, useValue: platformUtilsService },
        { provide: SsoLoginServiceAbstraction, useValue: ssoLoginService },
      ],
    });
    service = TestBed.inject(ExtensionLoginComponentService);
  });

  it("creates the service", () => {
    expect(service).toBeTruthy();
  });

  it("returns true if showPasswordless flag is enabled", () => {
    (flagEnabled as jest.Mock).mockReturnValue(true);
    expect(service.isLoginViaAuthRequestSupported()).toBe(true);
  });

  it("returns false if showPasswordless flag is disabled", () => {
    (flagEnabled as jest.Mock).mockReturnValue(false);
    expect(service.isLoginViaAuthRequestSupported()).toBeFalsy();
  });
});
