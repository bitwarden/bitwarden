import { CommonModule } from "@angular/common";
import { booleanAttribute, Component, Input } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { IconButtonModule, ItemModule, MenuModule } from "@bitwarden/components";

import { BrowserApi } from "../../../../../platform/browser/browser-api";
import BrowserPopupUtils from "../../../../../platform/popup/browser-popup-utils";
import { VaultPopupItemsService } from "../../../services/vault-popup-items.service";

@Component({
  standalone: true,
  selector: "app-item-more-options",
  templateUrl: "./item-more-options.component.html",
  imports: [ItemModule, IconButtonModule, MenuModule, CommonModule, JslibModule],
})
export class ItemMoreOptionsComponent {
  @Input({
    required: true,
  })
  cipher: CipherView;

  /**
   * Flag to hide the login specific menu options. Used for login items that are
   * already in the autofill list suggestion.
   */
  @Input({ transform: booleanAttribute })
  hideLoginOptions: boolean;

  protected autofillAllowed$ = this.vaultPopupItemsService.autofillAllowed$;

  constructor(
    private cipherService: CipherService,
    private vaultPopupItemsService: VaultPopupItemsService,
  ) {}

  get canEdit() {
    return this.cipher.edit;
  }

  get isLogin() {
    return this.cipher.type === CipherType.Login;
  }

  /**
   * Determines if the login cipher can be launched in a new browser tab.
   */
  get canLaunch() {
    return this.isLogin && this.cipher.login.canLaunch;
  }

  /**
   * Launches the login cipher in a new browser tab.
   */
  async launchCipher() {
    if (!this.canLaunch) {
      return;
    }

    await this.cipherService.updateLastLaunchedDate(this.cipher.id);

    await BrowserApi.createNewTab(this.cipher.login.launchUri);

    if (BrowserPopupUtils.inPopup(window)) {
      BrowserApi.closePopup(window);
    }
  }
}
