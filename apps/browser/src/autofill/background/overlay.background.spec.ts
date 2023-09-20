import { mock, mockReset } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { EnvironmentService } from "@bitwarden/common/platform/services/environment.service";
import { I18nService } from "@bitwarden/common/platform/services/i18n.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { BrowserStateService } from "../../platform/services/browser-state.service";
import {
  createAutofillPageDetailsMock,
  createChromeTabMock,
  createPageDetailMock,
} from "../jest/autofill-mocks";
import AutofillService from "../services/autofill.service";

import OverlayBackground from "./overlay.background";

const iconServerUrl = "https://icons.bitwarden.com/";

describe("OverlayBackground", () => {
  let overlayBackground: OverlayBackground;
  const cipherService = mock<CipherService>();
  const autofillService = mock<AutofillService>();
  const authService = mock<AuthService>();
  const environmentService = mock<EnvironmentService>({
    getIconsUrl: () => iconServerUrl,
  });
  const settingsService = mock<SettingsService>();
  const stateService = mock<BrowserStateService>();
  const i18nService = mock<I18nService>();

  beforeEach(() => {
    overlayBackground = new OverlayBackground(
      cipherService,
      autofillService,
      authService,
      environmentService,
      settingsService,
      stateService,
      i18nService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockReset(cipherService);
  });

  describe("removePageDetails", () => {
    it("remove the page details for a specific tab from the pageDetailsForTab object", () => {
      const tabId = 1;
      overlayBackground["pageDetailsForTab"][tabId] = [createPageDetailMock()];
      overlayBackground.removePageDetails(tabId);

      expect(overlayBackground["pageDetailsForTab"][tabId]).toBeUndefined();
    });
  });

  describe("updateAutofillOverlayCiphers", () => {
    const url = "https://tacos.com";
    const tab = createChromeTabMock({ url });
    const cipher1 = mock<CipherView>({
      id: "id-1",
      localData: { lastUsedDate: 222 },
      name: "name-1",
      type: CipherType.Login,
      login: { username: "username-1", uri: url },
    });
    const cipher2 = mock<CipherView>({
      id: "id-2",
      localData: { lastUsedDate: 111 },
      name: "name-2",
      type: CipherType.Login,
      login: { username: "username-2", uri: url },
    });

    beforeEach(() => {
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
    });

    it("will return early if the user auth status is not unlocked", async () => {
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Locked;
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId");
      jest.spyOn(cipherService, "getAllDecryptedForUrl");

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).not.toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).not.toHaveBeenCalled();
    });

    it("will return early if the tab is undefined", async () => {
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValue(undefined);
      jest.spyOn(cipherService, "getAllDecryptedForUrl");

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).not.toHaveBeenCalled();
    });

    it("will query all ciphers for the given url, sort them by last used, and format them for usage in the overlay", async () => {
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValue(tab);
      cipherService.getAllDecryptedForUrl.mockResolvedValue([cipher1, cipher2]);
      cipherService.sortCiphersByLastUsedThenName.mockReturnValue(-1);
      jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();
      jest.spyOn(overlayBackground as any, "getOverlayCipherData");

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).toHaveBeenCalledWith(url);
      expect(overlayBackground["cipherService"].sortCiphersByLastUsedThenName).toHaveBeenCalled();
      expect(overlayBackground["overlayLoginCiphers"]).toStrictEqual(
        new Map([
          ["overlay-cipher-0", cipher2],
          ["overlay-cipher-1", cipher1],
        ])
      );
      expect(overlayBackground["getOverlayCipherData"]).toHaveBeenCalled();
    });

    it("will post an `updateOverlayListCiphers` message to the overlay list port, and send a `updateIsOverlayCiphersPopulated` message to the tab indicating that the list of ciphers is populated", async () => {
      overlayBackground["overlayListPort"] = mock<chrome.runtime.Port>();
      cipherService.getAllDecryptedForUrl.mockResolvedValue([cipher1, cipher2]);
      cipherService.sortCiphersByLastUsedThenName.mockReturnValue(-1);
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValue(tab);
      jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

      await overlayBackground.updateAutofillOverlayCiphers();

      expect(overlayBackground["overlayListPort"].postMessage).toHaveBeenCalledWith({
        command: "updateOverlayListCiphers",
        ciphers: [
          {
            card: null,
            favorite: cipher2.favorite,
            icon: {
              fallbackImage: "images/bwi-globe.png",
              icon: "bwi-globe",
              image: "https://icons.bitwarden.com//tacos.com/icon.png",
              imageEnabled: true,
            },
            id: "overlay-cipher-0",
            login: {
              username: "us*******2",
            },
            name: "name-2",
            reprompt: cipher2.reprompt,
            type: 1,
          },
          {
            card: null,
            favorite: cipher1.favorite,
            icon: {
              fallbackImage: "images/bwi-globe.png",
              icon: "bwi-globe",
              image: "https://icons.bitwarden.com//tacos.com/icon.png",
              imageEnabled: true,
            },
            id: "overlay-cipher-1",
            login: {
              username: "us*******1",
            },
            name: "name-1",
            reprompt: cipher1.reprompt,
            type: 1,
          },
        ],
      });
      expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
        tab,
        "updateIsOverlayCiphersPopulated",
        { isOverlayCiphersPopulated: true }
      );
    });
  });

  describe("initOverlayBackground", () => {
    it("will set up the extension message listeners, get the overlay's visibility settings, and get the user's auth status", async () => {
      overlayBackground["setupExtensionMessageListeners"] = jest.fn();
      overlayBackground["getOverlayVisibility"] = jest.fn();
      overlayBackground["getAuthStatus"] = jest.fn();

      await overlayBackground["initOverlayBackground"]();

      expect(overlayBackground["setupExtensionMessageListeners"]).toHaveBeenCalled();
      expect(overlayBackground["getOverlayVisibility"]).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
    });
  });

  describe("getOverlayCipherData", () => {
    const url = "https://tacos.com";
    const cipher1 = mock<CipherView>({
      id: "id-1",
      localData: { lastUsedDate: 222 },
      name: "name-1",
      type: CipherType.Login,
      login: { username: "username-1", uri: url },
    });
    const cipher2 = mock<CipherView>({
      id: "id-2",
      localData: { lastUsedDate: 111 },
      name: "name-2",
      type: CipherType.Login,
      login: { username: "username-2", uri: url },
    });
    const cipher3 = mock<CipherView>({
      id: "id-3",
      localData: { lastUsedDate: 333 },
      name: "name-3",
      type: CipherType.Card,
      card: { number: "123456789", brand: "visa" },
    });
    const cipher4 = mock<CipherView>({
      id: "id-4",
      localData: { lastUsedDate: 444 },
      name: "name-4",
      type: CipherType.Card,
      card: { number: null, brand: "mastercard" },
    });

    it("will return an array of formatted cipher data", () => {
      overlayBackground["overlayLoginCiphers"] = new Map([
        ["overlay-cipher-0", cipher2],
        ["overlay-cipher-1", cipher1],
        ["overlay-cipher-2", cipher3],
        ["overlay-cipher-3", cipher4],
      ]);

      const overlayCipherData = overlayBackground["getOverlayCipherData"]();

      expect(overlayCipherData).toStrictEqual([
        {
          card: null,
          favorite: cipher2.favorite,
          icon: {
            fallbackImage: "images/bwi-globe.png",
            icon: "bwi-globe",
            image: "https://icons.bitwarden.com//tacos.com/icon.png",
            imageEnabled: true,
          },
          id: "overlay-cipher-0",
          login: {
            username: "us*******2",
          },
          name: "name-2",
          reprompt: cipher2.reprompt,
          type: 1,
        },
        {
          card: null,
          favorite: cipher1.favorite,
          icon: {
            fallbackImage: "images/bwi-globe.png",
            icon: "bwi-globe",
            image: "https://icons.bitwarden.com//tacos.com/icon.png",
            imageEnabled: true,
          },
          id: "overlay-cipher-1",
          login: {
            username: "us*******1",
          },
          name: "name-1",
          reprompt: cipher1.reprompt,
          type: 1,
        },
        {
          card: {
            brand: "visa",
            partialNumber: "*6789",
          },
          favorite: cipher3.favorite,
          icon: {
            fallbackImage: "",
            icon: "bwi-credit-card",
            image: undefined,
            imageEnabled: true,
          },
          id: "overlay-cipher-2",
          login: null,
          name: "name-3",
          reprompt: cipher3.reprompt,
          type: 3,
        },
        {
          card: {
            brand: "mastercard",
            partialNumber: "*undefined",
          },
          favorite: cipher4.favorite,
          icon: {
            fallbackImage: "",
            icon: "bwi-credit-card",
            image: undefined,
            imageEnabled: true,
          },
          id: "overlay-cipher-3",
          login: null,
          name: "name-4",
          reprompt: cipher4.reprompt,
          type: 3,
        },
      ]);
    });
  });

  describe("storePageDetails", () => {
    it("will store the page details provided by the message by the tab id of the sender", () => {
      const message = {
        command: "storePageDetails",
        details: createAutofillPageDetailsMock({
          login: { username: "username", password: "password" },
        }),
      };
      const sender = mock<chrome.runtime.MessageSender>({
        tab: {
          id: 1,
        },
      });

      overlayBackground["storePageDetails"](message, sender);

      expect(overlayBackground["pageDetailsForTab"][sender.tab.id]).toStrictEqual([
        {
          frameId: sender.frameId,
          tab: sender.tab,
          details: message.details,
        },
      ]);
    });

    it("will store page details for a tab that already has a set of page details stored ", () => {
      const details1 = createAutofillPageDetailsMock({
        login: { username: "username1", password: "password1" },
      });
      const details2 = createAutofillPageDetailsMock({
        login: { username: "username2", password: "password2" },
      });
      const message = {
        command: "storePageDetails",
        details: details2,
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });

      overlayBackground["pageDetailsForTab"][sender.tab.id] = [
        {
          frameId: sender.frameId,
          tab: sender.tab,
          details: details1,
        },
      ];
      overlayBackground["storePageDetails"](message, sender);

      expect(overlayBackground["pageDetailsForTab"][sender.tab.id]).toStrictEqual([
        {
          frameId: sender.frameId,
          tab: sender.tab,
          details: details1,
        },
        {
          frameId: sender.frameId,
          tab: sender.tab,
          details: details2,
        },
      ]);
    });
  });

  describe("fillSelectedOverlayListItem", () => {
    it("returns early if the overlay cipher id is not provided", async () => {
      const message = {
        command: "fillSelectedOverlayListItem",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const port = mock<chrome.runtime.Port>({ sender });
      jest.spyOn(overlayBackground["overlayLoginCiphers"], "get");
      jest.spyOn(overlayBackground["autofillService"], "isPasswordRepromptRequired");
      jest.spyOn(overlayBackground["autofillService"], "doAutoFill");

      await overlayBackground["fillSelectedOverlayListItem"](message, port);

      expect(overlayBackground["overlayLoginCiphers"].get).not.toHaveBeenCalled();
      expect(
        overlayBackground["autofillService"].isPasswordRepromptRequired
      ).not.toHaveBeenCalled();
      expect(overlayBackground["autofillService"].doAutoFill).not.toHaveBeenCalled();
    });

    it("returns early if a master password reprompt is required", async () => {
      const message = {
        command: "fillSelectedOverlayListItem",
        overlayCipherId: "overlay-cipher-1",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const port = mock<chrome.runtime.Port>({ sender });
      const cipher = mock<CipherView>({
        reprompt: CipherRepromptType.Password,
        type: CipherType.Login,
      });
      overlayBackground["overlayLoginCiphers"] = new Map([["overlay-cipher-1", cipher]]);
      jest.spyOn(overlayBackground["overlayLoginCiphers"], "get");
      jest
        .spyOn(overlayBackground["autofillService"], "isPasswordRepromptRequired")
        .mockResolvedValue(true);
      jest.spyOn(overlayBackground["autofillService"], "doAutoFill");

      await overlayBackground["fillSelectedOverlayListItem"](message, port);

      expect(overlayBackground["overlayLoginCiphers"].get).toHaveBeenCalled();
      expect(overlayBackground["autofillService"].isPasswordRepromptRequired).toHaveBeenCalledWith(
        cipher,
        sender.tab
      );
      expect(overlayBackground["autofillService"].doAutoFill).not.toHaveBeenCalled();
    });

    it("will do the autofill of the selected cipher and move it to the top of the front of the ciphers map", async () => {
      const cipher1 = mock<CipherView>({ id: "overlay-cipher-1" });
      const cipher2 = mock<CipherView>({ id: "overlay-cipher-2" });
      const cipher3 = mock<CipherView>({ id: "overlay-cipher-3" });
      const message = {
        command: "fillSelectedOverlayListItem",
        overlayCipherId: "overlay-cipher-2",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const port = mock<chrome.runtime.Port>({ sender });
      overlayBackground["overlayLoginCiphers"] = new Map([
        ["overlay-cipher-1", cipher1],
        ["overlay-cipher-2", cipher2],
        ["overlay-cipher-3", cipher3],
      ]);
      jest.spyOn(overlayBackground["overlayLoginCiphers"], "get");
      jest
        .spyOn(overlayBackground["autofillService"], "isPasswordRepromptRequired")
        .mockResolvedValue(false);
      jest.spyOn(overlayBackground["autofillService"], "doAutoFill");

      await overlayBackground["fillSelectedOverlayListItem"](message, port);

      expect(overlayBackground["autofillService"].isPasswordRepromptRequired).toHaveBeenCalledWith(
        cipher2,
        sender.tab
      );
      expect(overlayBackground["autofillService"].doAutoFill).toHaveBeenCalledWith({
        tab: sender.tab,
        cipher: cipher2,
        pageDetails: undefined,
        fillNewPassword: true,
        allowTotpAutofill: true,
      });
      expect(overlayBackground["overlayLoginCiphers"].entries()).toStrictEqual(
        new Map([
          ["overlay-cipher-2", cipher2],
          ["overlay-cipher-1", cipher1],
          ["overlay-cipher-3", cipher3],
        ]).entries()
      );
    });
  });
});
