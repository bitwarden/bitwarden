import {
  DefaultTwoFactorAuthComponentService,
  TwoFactorAuthComponentService,
} from "@bitwarden/auth/angular";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";

import { BrowserApi } from "../../platform/browser/browser-api";
import BrowserPopupUtils from "../../platform/popup/browser-popup-utils";
import {
  AuthPopoutType,
  closeSsoAuthResultPopout,
  closeTwoFactorAuthEmailPopout,
  closeTwoFactorAuthWebAuthnPopout,
} from "../popup/utils/auth-popout-window";

export class ExtensionTwoFactorAuthComponentService
  extends DefaultTwoFactorAuthComponentService
  implements TwoFactorAuthComponentService
{
  constructor(private window: Window) {
    super();
  }

  shouldCheckForWebAuthnQueryParamResponse(): boolean {
    return true;
  }

  async extendPopupWidthIfRequired(selected2faProviderType: TwoFactorProviderType): Promise<void> {
    // WebAuthn prompt appears inside the popup on linux, and requires a larger popup width
    // than usual to avoid cutting off the dialog.
    const isLinux = await this.isLinux();
    if (selected2faProviderType === TwoFactorProviderType.WebAuthn && isLinux) {
      document.body.classList.add("linux-webauthn");
    }
  }

  removePopupWidthExtension(): void {
    document.body.classList.remove("linux-webauthn");
  }

  closeWindow(): void {
    this.window.close();
  }

  async handle2faSuccess(): Promise<void> {
    // TODO: confirm that moving this from SSO flow only to general flow doesn't introduce any issues
    // Force sidebars (FF && Opera) to reload while exempting current window
    // because we are just going to close the current window if it is in a popout
    // or navigate forward if it is in the popup
    BrowserApi.reloadOpenWindows(true);

    await this.closeSingleActionPopouts();
  }

  private async closeSingleActionPopouts(): Promise<void> {
    // If we are in a single action popout, we don't need the popout anymore because the intent
    // is for the user to be left on the web vault screen which tells them to continue in
    // the browser extension (sidebar or popup).  We don't want the user to be left with a
    // floating, popped out extension which could be lost behind another window or minimized.
    // Currently, the popped out window thinks it is active and wouldn't time out which
    // leads to the security concern. So, we close the popped out extension to avoid this.
    const inSsoAuthResultPopout = BrowserPopupUtils.inSingleActionPopout(
      this.window,
      AuthPopoutType.ssoAuthResult,
    );
    if (inSsoAuthResultPopout) {
      await closeSsoAuthResultPopout();
      return;
    }

    const inTwoFactorAuthWebAuthnPopout = BrowserPopupUtils.inSingleActionPopout(
      this.window,
      AuthPopoutType.twoFactorAuthWebAuthn,
    );

    if (inTwoFactorAuthWebAuthnPopout) {
      await closeTwoFactorAuthWebAuthnPopout();
      return;
    }

    const inTwoFactorAuthEmailPopout = BrowserPopupUtils.inSingleActionPopout(
      this.window,
      AuthPopoutType.twoFactorAuthEmail,
    );

    if (inTwoFactorAuthEmailPopout) {
      await closeTwoFactorAuthEmailPopout();
      return;
    }
  }

  private async isLinux(): Promise<boolean> {
    const platformInfo = await BrowserApi.getPlatformInfo();
    return platformInfo.os === "linux";
  }
}
