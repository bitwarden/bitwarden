export type ClipboardOptions = {
  allowHistory?: boolean;
  clearing?: boolean;
  clearMs?: number;
  window?: Window;
};

export abstract class ClipboardService {
  abstract copyToClipboard(text: string, options?: ClipboardOptions): void | boolean;
  abstract readFromClipboard(): Promise<string>;
  abstract clearClipboard(clipboardValue: string, timeoutMs?: number): Promise<void>;
}
