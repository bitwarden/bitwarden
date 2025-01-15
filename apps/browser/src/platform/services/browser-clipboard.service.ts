import {
  ClipboardOptions,
  ClipboardService,
} from "@bitwarden/common/platform/abstractions/clipboard.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { SafariApp } from "../../browser/safariApp";
import { BrowserApi } from "../browser/browser-api";
import { OffscreenDocumentService } from "../offscreen-document/abstractions/offscreen-document";

import BrowserClipboardUtils from "./browser-clipboard.utils";

export class BrowserClipboardService implements ClipboardService {
  constructor(
    private platformUtilsService: PlatformUtilsService,
    private clipboardWriteCallback: (clipboardValue: string, clearMs?: number) => void,
    private globalContext: Window | ServiceWorkerGlobalScope,
    private offscreenDocumentService: OffscreenDocumentService,
  ) {}

  /**
   * Copies the passed text to the clipboard. For Safari, this will use
   * the native messaging API to send the text to the Bitwarden app. If
   * the extension is using manifest v3, the offscreen document API will
   * be used to copy the text to the clipboard. Otherwise, the browser's
   * clipboard API will be used.
   *
   * @param text - The text to copy to the clipboard.
   * @param options - Options for the clipboard operation.
   */
  copyToClipboard(text: string, options?: ClipboardOptions): void {
    const windowContext = options?.window || (this.globalContext as Window);
    const clearing = Boolean(options?.clearing);
    const clearMs = options?.clearMs;
    const handleClipboardWriteCallback = () => {
      if (!clearing && this.clipboardWriteCallback != null) {
        this.clipboardWriteCallback(text, clearMs);
      }
    };

    if (this.platformUtilsService.isSafari()) {
      void SafariApp.sendMessageToApp("copyToClipboard", text).then(handleClipboardWriteCallback);

      return;
    }

    if (this.platformUtilsService.isChrome() && text === "") {
      text = "\u0000";
    }

    if (BrowserApi.isManifestVersion(3) && this.offscreenDocumentService.offscreenApiSupported()) {
      void this.triggerOffscreenCopyToClipboard(text).then(handleClipboardWriteCallback);

      return;
    }

    void BrowserClipboardUtils.copy(windowContext, text).then(handleClipboardWriteCallback);
  }

  /**
   * Reads the text from the clipboard. For Safari, this will use the
   * native messaging API to request the text from the Bitwarden app. If
   * the extension is using manifest v3, the offscreen document API will
   * be used to read the text from the clipboard. Otherwise, the browser's
   * clipboard API will be used.
   *
   * @param options - Options for the clipboard operation.
   */
  async readFromClipboard(options?: ClipboardOptions): Promise<string> {
    const windowContext = options?.window || (this.globalContext as Window);

    if (this.platformUtilsService.isSafari()) {
      return await SafariApp.sendMessageToApp("readFromClipboard");
    }

    if (BrowserApi.isManifestVersion(3) && this.offscreenDocumentService.offscreenApiSupported()) {
      return await this.triggerOffscreenReadFromClipboard();
    }

    return await BrowserClipboardUtils.read(windowContext);
  }

  clearClipboard(clipboardValue: string, timeoutMs?: number): Promise<void> {
    throw new Error("Method not implemented.");
  }

  /**
   * Triggers the offscreen document API to copy the text to the clipboard.
   */
  private async triggerOffscreenCopyToClipboard(text: string) {
    await this.offscreenDocumentService.withDocument(
      [chrome.offscreen.Reason.CLIPBOARD],
      "Write text to the clipboard.",
      async () => {
        await BrowserApi.sendMessageWithResponse("offscreenCopyToClipboard", { text });
      },
    );
  }

  /**
   * Triggers the offscreen document API to read the text from the clipboard.
   */
  private async triggerOffscreenReadFromClipboard() {
    const response = await this.offscreenDocumentService.withDocument(
      [chrome.offscreen.Reason.CLIPBOARD],
      "Read text from the clipboard.",
      async () => {
        return await BrowserApi.sendMessageWithResponse("offscreenReadFromClipboard");
      },
    );
    if (typeof response === "string") {
      return response;
    }

    return "";
  }
}
