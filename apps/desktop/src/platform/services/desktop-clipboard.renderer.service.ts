import {
  ClipboardOptions,
  ClipboardService,
} from "@bitwarden/common/platform/abstractions/clipboard.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

import { ClipboardWriteMessage } from "../types/clipboard";

export class DesktopRendererClipboardService implements ClipboardService {
  constructor(private messagingService: MessagingService) {}

  copyToClipboard(text: string, options?: ClipboardOptions): void | boolean {
    const clearing = options?.clearing === true;
    const clearMs = options?.clearMs ?? null;

    void ipc.platform.clipboard.write({
      text: text,
      password: (options?.allowHistory ?? false) === false, // default to false
    } satisfies ClipboardWriteMessage);

    if (!clearing) {
      this.messagingService.send("copiedToClipboard", {
        clipboardValue: text,
        clearMs: clearMs,
        clearing: clearing,
      });
    }
  }
  readFromClipboard(): Promise<string> {
    return ipc.platform.clipboard.read();
  }
  clearClipboard(clipboardValue: string, timeoutMs?: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
