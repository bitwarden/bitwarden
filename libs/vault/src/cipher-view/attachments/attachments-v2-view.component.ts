import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NEVER, switchMap } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { OrganizationId } from "@bitwarden/common/types/guid";
import { OrgKey } from "@bitwarden/common/types/key";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  ItemModule,
  IconButtonModule,
  SectionComponent,
  SectionHeaderComponent,
  TypographyModule,
} from "@bitwarden/components";

import { DownloadAttachmentComponent } from "../../cipher-form/components/attachments/download-attachment/download-attachment.component";

@Component({
  selector: "app-attachments-v2-view",
  templateUrl: "attachments-v2-view.component.html",
  standalone: true,
  imports: [
    CommonModule,
    JslibModule,
    ItemModule,
    IconButtonModule,
    SectionComponent,
    SectionHeaderComponent,
    TypographyModule,
    DownloadAttachmentComponent,
  ],
})
export class AttachmentsV2ViewComponent {
  @Input() cipher: CipherView;

  canAccessPremium: boolean;
  orgKey: OrgKey;

  constructor(
    private cryptoService: CryptoService,
    private billingAccountProfileStateService: BillingAccountProfileStateService,
    private stateProvider: StateProvider,
  ) {
    this.subscribeToHasPremiumCheck();
    this.subscribeToOrgKey();
  }

  subscribeToHasPremiumCheck() {
    this.billingAccountProfileStateService.hasPremiumFromAnySource$
      .pipe(takeUntilDestroyed())
      .subscribe((data) => {
        this.canAccessPremium = data;
      });
  }

  subscribeToOrgKey() {
    this.stateProvider.activeUserId$
      .pipe(
        switchMap((userId) => (userId != null ? this.cryptoService.orgKeys$(userId) : NEVER)),
        takeUntilDestroyed(),
      )
      .subscribe((data: Record<OrganizationId, OrgKey> | null) => {
        if (data) {
          this.orgKey = data[this.cipher.organizationId as OrganizationId];
        }
      });
  }
}
