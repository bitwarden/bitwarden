import { flushPromises, sendMockExtensionMessage } from "../../autofill/spec/testing-utils";
import { BrowserApi } from "../browser/browser-api";
import BrowserClipboardUtils from "../services/browser-clipboard.utils";

describe("OffscreenDocument", () => {
  const browserApiMessageListenerSpy = jest.spyOn(BrowserApi, "messageListener");
  const browserClipboardUtilsCopySpy = jest.spyOn(BrowserClipboardUtils, "copy");
  const browserClipboardUtilsReadSpy = jest.spyOn(BrowserClipboardUtils, "read");
  const consoleErrorSpy = jest.spyOn(console, "error");

  // FIXME: Remove when updating file. Eslint update
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../offscreen-document/offscreen-document");

  describe("init", () => {
    it("sets up a `chrome.runtime.onMessage` listener", () => {
      expect(browserApiMessageListenerSpy).toHaveBeenCalledWith(
        "offscreen-document",
        expect.any(Function),
      );
    });
  });

  describe("extension message handlers", () => {
    it("ignores messages that do not have a handler registered with the corresponding command", () => {
      sendMockExtensionMessage({ command: "notAValidCommand" });

      expect(browserClipboardUtilsCopySpy).not.toHaveBeenCalled();
      expect(browserClipboardUtilsReadSpy).not.toHaveBeenCalled();
    });

    it("shows a console message if the handler throws an error", async () => {
      const error = new Error("test error");
      browserClipboardUtilsCopySpy.mockRejectedValueOnce(new Error("test error"));

      sendMockExtensionMessage({ command: "offscreenCopyToClipboard", text: "test" });
      await flushPromises();

      expect(browserClipboardUtilsCopySpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error resolving extension message response",
        error,
      );
    });

    describe("handleOffscreenCopyToClipboard", () => {
      it("copies the message text", async () => {
        const text = "test";

        sendMockExtensionMessage({ command: "offscreenCopyToClipboard", text });
        await flushPromises();

        expect(browserClipboardUtilsCopySpy).toHaveBeenCalledWith(window, text);
      });
    });

    describe("handleOffscreenReadFromClipboard", () => {
      it("reads the value from the clipboard service", async () => {
        sendMockExtensionMessage({ command: "offscreenReadFromClipboard" });
        await flushPromises();

        expect(browserClipboardUtilsReadSpy).toHaveBeenCalledWith(window);
      });
    });
  });
});
