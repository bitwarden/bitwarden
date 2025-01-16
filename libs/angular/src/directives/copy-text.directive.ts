// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Directive, ElementRef, HostListener, Input } from "@angular/core";

import { ClientType } from "@bitwarden/common/enums";
import { ClipboardService } from "@bitwarden/common/platform/abstractions/clipboard.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

@Directive({
  selector: "[appCopyText]",
})
export class CopyTextDirective {
  constructor(
    private el: ElementRef,
    private platformUtilsService: PlatformUtilsService,
    private clipboardService: ClipboardService,
  ) {}

  @Input("appCopyText") copyText: string;

  @HostListener("copy") onCopy() {
    if (window == null) {
      return;
    }

    const timeout = this.platformUtilsService.getClientType() === ClientType.Desktop ? 100 : 0;
    setTimeout(() => {
      this.clipboardService.copyToClipboard(this.copyText, { window: window });
    }, timeout);
  }
}
