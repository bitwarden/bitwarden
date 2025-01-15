import {
  DefaultTwoFactorAuthWebAuthnComponentService,
  TwoFactorAuthWebAuthnComponentService,
} from "@bitwarden/auth/angular";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

export class ExtensionTwoFactorAuthWebAuthnComponentService
  extends DefaultTwoFactorAuthWebAuthnComponentService
  implements TwoFactorAuthWebAuthnComponentService
{
  constructor(private platformUtilsService: PlatformUtilsService) {
    super();
  }

  shouldOpenWebAuthnInNewTab(): boolean {
    const isChrome = this.platformUtilsService.isChrome();
    if (isChrome) {
      // Chrome now supports WebAuthn in the iframe in the extension now.
      return false;
    }

    return true;
  }
}
