import { ClipboardService } from "@bitwarden/common/platform/abstractions/clipboard.service";

export class CliClipboardService implements ClipboardService {
  copyToClipboard(text: string, options?: any): void {
    throw new Error("Not implemented.");
  }

  readFromClipboard(options?: any): Promise<string> {
    throw new Error("Not implemented.");
  }
  clearClipboard(clipboardValue: string, timeoutMs?: number): Promise<void> {
    throw new Error("Not implemented.");
  }
}
