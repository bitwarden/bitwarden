import { CommonModule, Location } from "@angular/common";
import { Component } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Observable, combineLatest, first, switchMap } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { OrganizationId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  ButtonModule,
  CardComponent,
  SelectModule,
  FormFieldModule,
  AsyncActionsModule,
} from "@bitwarden/components";
import { AssignCollectionsComponent, CollectionAssignmentParams } from "@bitwarden/vault";

import { PopOutComponent } from "../../../../../platform/popup/components/pop-out.component";
import { PopupFooterComponent } from "../../../../../platform/popup/layout/popup-footer.component";
import { PopupHeaderComponent } from "../../../../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../../../../platform/popup/layout/popup-page.component";

@Component({
  standalone: true,
  selector: "app-assign-collections",
  templateUrl: "./assign-collections.component.html",
  imports: [
    AsyncActionsModule,
    ButtonModule,
    CommonModule,
    JslibModule,
    SelectModule,
    FormFieldModule,
    AssignCollectionsComponent,
    CardComponent,
    ReactiveFormsModule,
    PopupPageComponent,
    PopupHeaderComponent,
    PopupFooterComponent,
    PopOutComponent,
  ],
})
export class AssignCollections {
  /** Loading state of the collections form */
  protected loading = false;
  /** Disabled state of the collections form */
  protected disabled = false;
  /** Params needed to populate the assign collections component */
  params: CollectionAssignmentParams;

  constructor(
    private location: Location,
    private collectionService: CollectionService,
    private cipherService: CipherService,
    route: ActivatedRoute,
  ) {
    const $cipher: Observable<CipherView> = route.queryParams.pipe(
      takeUntilDestroyed(),
      switchMap(({ cipherId }) => this.cipherService.get(cipherId)),
      switchMap((cipherDomain) =>
        this.cipherService
          .getKeyForCipherKeyDecryption(cipherDomain)
          .then(cipherDomain.decrypt.bind(cipherDomain)),
      ),
    );

    combineLatest([$cipher, this.collectionService.decryptedCollections$])
      .pipe(takeUntilDestroyed(), first())
      .subscribe(([cipherView, collections]) => {
        this.params = {
          ciphers: [cipherView],
          organizationId: (cipherView?.organizationId as OrganizationId) ?? null,
          availableCollections: collections.filter((c) => !c.readOnly),
        };
      });
  }

  /** Navigates the user back to the previous screen */
  navigateBack() {
    this.location.back();
  }
}
