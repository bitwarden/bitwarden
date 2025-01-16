import { MockProxy, mock } from "jest-mock-extended";

import { DeviceType } from "@bitwarden/common/enums";

import { flushPromises } from "../../autofill/spec/testing-utils";
import { SafariApp } from "../../browser/safariApp";
import { BrowserApi } from "../browser/browser-api";
import { OffscreenDocumentService } from "../offscreen-document/abstractions/offscreen-document";

import { BrowserClipboardService } from "./browser-clipboard.service";
import BrowserClipboardUtils from "./browser-clipboard.utils";
import { BrowserPlatformUtilsService } from "./platform-utils/browser-platform-utils.service";

class TestBrowserPlatformUtilsService extends BrowserPlatformUtilsService {
  constructor(win: Window & typeof globalThis) {
    super(win);
  }

  showToast(
    type: "error" | "success" | "warning" | "info",
    title: string,
    text: string | string[],
    options?: any,
  ): void {
    throw new Error("Method not implemented.");
  }
}

describe("Browser Clipboard Service", () => {
  let platformUtilsService: BrowserPlatformUtilsService;
  let clipboardService: BrowserClipboardService;
  let offscreenDocumentService: MockProxy<OffscreenDocumentService>;
  const clipboardWriteCallbackSpy = jest.fn();
  BrowserApi.sendMessageWithResponse = jest.fn().mockResolvedValueOnce(undefined);

  beforeEach(() => {
    offscreenDocumentService = mock();
    (window as any).matchMedia = jest.fn().mockReturnValueOnce({});
    platformUtilsService = new TestBrowserPlatformUtilsService(window);
    clipboardService = new BrowserClipboardService(
      platformUtilsService,
      clipboardWriteCallbackSpy,
      window,
      offscreenDocumentService,
    );
  });

  describe("copyToClipboard", () => {
    const getManifestVersionSpy = jest.spyOn(BrowserApi, "manifestVersion", "get");
    const sendMessageToAppSpy = jest.spyOn(SafariApp, "sendMessageToApp");
    const clipboardServiceCopySpy = jest.spyOn(BrowserClipboardUtils, "copy");
    let triggerOffscreenCopyToClipboardSpy: jest.SpyInstance;

    beforeEach(() => {
      getManifestVersionSpy.mockReturnValue(2);
      triggerOffscreenCopyToClipboardSpy = jest.spyOn(
        clipboardService as any,
        "triggerOffscreenCopyToClipboard",
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("sends a copy to clipboard message to the desktop application if a user is using the safari browser", async () => {
      const text = "test";
      const clearMs = 1000;
      sendMessageToAppSpy.mockResolvedValueOnce("success");
      jest.spyOn(platformUtilsService, "getDevice").mockReturnValue(DeviceType.SafariExtension);

      clipboardService.copyToClipboard(text, { clearMs });
      await flushPromises();

      expect(sendMessageToAppSpy).toHaveBeenCalledWith("copyToClipboard", text);
      expect(clipboardWriteCallbackSpy).toHaveBeenCalledWith(text, clearMs);
      expect(clipboardServiceCopySpy).not.toHaveBeenCalled();
      expect(triggerOffscreenCopyToClipboardSpy).not.toHaveBeenCalled();
    });

    it("sets the copied text to a unicode placeholder when the user is using Chrome if the passed text is an empty string", async () => {
      const text = "";
      jest.spyOn(platformUtilsService, "getDevice").mockReturnValue(DeviceType.ChromeExtension);

      clipboardService.copyToClipboard(text);
      await flushPromises();

      expect(clipboardServiceCopySpy).toHaveBeenCalledWith(window, "\u0000");
    });

    it("copies the passed text using the BrowserClipboardUtils", async () => {
      const text = "test";
      jest.spyOn(platformUtilsService, "getDevice").mockReturnValue(DeviceType.ChromeExtension);

      clipboardService.copyToClipboard(text, { window: self });
      await flushPromises();

      expect(clipboardServiceCopySpy).toHaveBeenCalledWith(self, text);
      expect(triggerOffscreenCopyToClipboardSpy).not.toHaveBeenCalled();
    });

    it("copies the passed text using the offscreen document if the extension is using manifest v3", async () => {
      const text = "test";
      offscreenDocumentService.offscreenApiSupported.mockReturnValue(true);
      getManifestVersionSpy.mockReturnValue(3);

      clipboardService.copyToClipboard(text);
      await flushPromises();

      expect(triggerOffscreenCopyToClipboardSpy).toHaveBeenCalledWith(text);
      expect(clipboardServiceCopySpy).not.toHaveBeenCalled();
      expect(offscreenDocumentService.withDocument).toHaveBeenCalledWith(
        [chrome.offscreen.Reason.CLIPBOARD],
        "Write text to the clipboard.",
        expect.any(Function),
      );

      const callback = offscreenDocumentService.withDocument.mock.calls[0][2];
      await callback();
      expect(BrowserApi.sendMessageWithResponse).toHaveBeenCalledWith("offscreenCopyToClipboard", {
        text,
      });
    });

    it("skips the clipboardWriteCallback if the clipboard is clearing", async () => {
      jest.spyOn(platformUtilsService, "getDevice").mockReturnValue(DeviceType.ChromeExtension);

      clipboardService.copyToClipboard("test", { window: self, clearing: true });
      await flushPromises();

      expect(clipboardWriteCallbackSpy).not.toHaveBeenCalled();
    });
  });

  describe("readFromClipboard", () => {
    const getManifestVersionSpy = jest.spyOn(BrowserApi, "manifestVersion", "get");
    const sendMessageToAppSpy = jest.spyOn(SafariApp, "sendMessageToApp");
    const clipboardServiceReadSpy = jest.spyOn(BrowserClipboardUtils, "read");

    beforeEach(() => {
      getManifestVersionSpy.mockReturnValue(2);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("sends a ready from clipboard message to the desktop application if a user is using the safari browser", async () => {
      sendMessageToAppSpy.mockResolvedValueOnce("test");
      jest.spyOn(platformUtilsService, "getDevice").mockReturnValue(DeviceType.SafariExtension);

      const result = await clipboardService.readFromClipboard();

      expect(sendMessageToAppSpy).toHaveBeenCalledWith("readFromClipboard");
      expect(clipboardServiceReadSpy).not.toHaveBeenCalled();
      expect(result).toBe("test");
    });

    it("reads text from the clipboard using the ClipboardService", async () => {
      jest.spyOn(platformUtilsService, "getDevice").mockReturnValue(DeviceType.ChromeExtension);
      clipboardServiceReadSpy.mockResolvedValueOnce("test");

      const result = await clipboardService.readFromClipboard({ window: self });

      expect(clipboardServiceReadSpy).toHaveBeenCalledWith(self);
      expect(sendMessageToAppSpy).not.toHaveBeenCalled();
      expect(result).toBe("test");
    });

    it("reads the clipboard text using the offscreen document", async () => {
      offscreenDocumentService.offscreenApiSupported.mockReturnValue(true);
      getManifestVersionSpy.mockReturnValue(3);
      offscreenDocumentService.withDocument.mockImplementationOnce((_, __, callback) =>
        Promise.resolve("test"),
      );

      await clipboardService.readFromClipboard();

      expect(offscreenDocumentService.withDocument).toHaveBeenCalledWith(
        [chrome.offscreen.Reason.CLIPBOARD],
        "Read text from the clipboard.",
        expect.any(Function),
      );

      const callback = offscreenDocumentService.withDocument.mock.calls[0][2];
      await callback();
      expect(BrowserApi.sendMessageWithResponse).toHaveBeenCalledWith("offscreenReadFromClipboard");
    });

    it("returns an empty string from the offscreen document if the response is not of type string", async () => {
      jest.spyOn(platformUtilsService, "getDevice").mockReturnValue(DeviceType.ChromeExtension);
      getManifestVersionSpy.mockReturnValue(3);
      jest.spyOn(BrowserApi, "sendMessageWithResponse").mockResolvedValue(1);
      offscreenDocumentService.withDocument.mockImplementationOnce((_, __, callback) =>
        Promise.resolve(1),
      );

      const result = await clipboardService.readFromClipboard();

      expect(result).toBe("");
    });
  });
});
