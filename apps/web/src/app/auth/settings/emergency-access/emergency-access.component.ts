import { Component, OnInit, ViewChild, ViewContainerRef } from "@angular/core";

import { UserNamePipe } from "@bitwarden/angular/pipes/user-name.pipe";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { DialogService } from "@bitwarden/components";

import { EmergencyAccessStatusType } from "../../core/enums/emergency-access-status-type";
import { EmergencyAccessType } from "../../core/enums/emergency-access-type";
import { EmergencyAccessService } from "../../core/services/emergency-access/emergency-access.service";
import {
  EmergencyAccessGranteeView,
  EmergencyAccessGrantorView,
} from "../../core/views/emergency-access.view";

import { EmergencyAccessAddEditComponent } from "./emergency-access-add-edit.component";
import { EmergencyAccessConfirmComponent } from "./emergency-access-confirm.component";
import { EmergencyAccessTakeoverComponent } from "./emergency-access-takeover.component";

@Component({
  selector: "emergency-access",
  templateUrl: "emergency-access.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class EmergencyAccessComponent implements OnInit {
  @ViewChild("addEdit", { read: ViewContainerRef, static: true }) addEditModalRef: ViewContainerRef;
  @ViewChild("takeoverTemplate", { read: ViewContainerRef, static: true })
  takeoverModalRef: ViewContainerRef;
  @ViewChild("confirmTemplate", { read: ViewContainerRef, static: true })
  confirmModalRef: ViewContainerRef;

  loaded = false;
  canAccessPremium: boolean;
  trustedContacts: EmergencyAccessGranteeView[];
  grantedContacts: EmergencyAccessGrantorView[];
  emergencyAccessType = EmergencyAccessType;
  emergencyAccessStatusType = EmergencyAccessStatusType;
  actionPromise: Promise<any>;
  isOrganizationOwner: boolean;

  constructor(
    private emergencyAccessService: EmergencyAccessService,
    private i18nService: I18nService,
    private modalService: ModalService,
    private platformUtilsService: PlatformUtilsService,
    private messagingService: MessagingService,
    private userNamePipe: UserNamePipe,
    private logService: LogService,
    private stateService: StateService,
    private organizationService: OrganizationService,
    protected dialogService: DialogService
  ) {}

  async ngOnInit() {
    this.canAccessPremium = await this.stateService.getCanAccessPremium();
    const orgs = await this.organizationService.getAll();
    this.isOrganizationOwner = orgs.some((o) => o.isOwner);
    this.load();
  }

  async load() {
    this.trustedContacts = await this.emergencyAccessService.getEmergencyAccessTrusted();
    this.grantedContacts = await this.emergencyAccessService.getEmergencyAccessGranted();
    this.loaded = true;
  }

  async premiumRequired() {
    if (!this.canAccessPremium) {
      this.messagingService.send("premiumRequired");
      return;
    }
  }

  async edit(details: EmergencyAccessGranteeView) {
    const [modal] = await this.modalService.openViewRef(
      EmergencyAccessAddEditComponent,
      this.addEditModalRef,
      (comp) => {
        comp.name = this.userNamePipe.transform(details);
        comp.emergencyAccessId = details?.id;
        comp.readOnly = !this.canAccessPremium;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        comp.onSaved.subscribe(() => {
          modal.close();
          this.load();
        });
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        comp.onDeleted.subscribe(() => {
          modal.close();
          this.remove(details);
        });
      }
    );
  }

  invite() {
    this.edit(null);
  }

  async reinvite(contact: EmergencyAccessGranteeView) {
    if (this.actionPromise != null) {
      return;
    }
    this.actionPromise = this.emergencyAccessService.reinvite(contact.id);
    await this.actionPromise;
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("hasBeenReinvited", contact.email)
    );
    this.actionPromise = null;
  }

  async confirm(contact: EmergencyAccessGranteeView) {
    function updateUser() {
      contact.status = EmergencyAccessStatusType.Confirmed;
    }

    if (this.actionPromise != null) {
      return;
    }

    const autoConfirm = await this.stateService.getAutoConfirmFingerPrints();
    if (autoConfirm == null || !autoConfirm) {
      const [modal] = await this.modalService.openViewRef(
        EmergencyAccessConfirmComponent,
        this.confirmModalRef,
        (comp) => {
          comp.name = this.userNamePipe.transform(contact);
          comp.emergencyAccessId = contact.id;
          comp.userId = contact?.granteeId;
          // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
          comp.onConfirmed.subscribe(async () => {
            modal.close();

            comp.formPromise = this.emergencyAccessService.confirm(contact.id, contact.granteeId);
            await comp.formPromise;

            updateUser();
            this.platformUtilsService.showToast(
              "success",
              null,
              this.i18nService.t("hasBeenConfirmed", this.userNamePipe.transform(contact))
            );
          });
        }
      );
      return;
    }

    this.actionPromise = this.emergencyAccessService.confirm(contact.id, contact.granteeId);
    await this.actionPromise;
    updateUser();

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("hasBeenConfirmed", this.userNamePipe.transform(contact))
    );
    this.actionPromise = null;
  }

  async remove(details: EmergencyAccessGranteeView | EmergencyAccessGrantorView) {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: this.userNamePipe.transform(details),
      content: { key: "removeUserConfirmation" },
      type: "warning",
    });

    if (!confirmed) {
      return false;
    }

    try {
      await this.emergencyAccessService.delete(details.id);
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("removedUserId", this.userNamePipe.transform(details))
      );

      if (details instanceof EmergencyAccessGranteeView) {
        this.removeGrantee(details);
      } else {
        this.removeGrantor(details);
      }
    } catch (e) {
      this.logService.error(e);
    }
  }

  async requestAccess(details: EmergencyAccessGrantorView) {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: this.userNamePipe.transform(details),
      content: {
        key: "requestAccessConfirmation",
        placeholders: [details.waitTimeDays.toString()],
      },
      acceptButtonText: { key: "requestAccess" },
      type: "warning",
    });

    if (!confirmed) {
      return false;
    }

    await this.emergencyAccessService.requestAccess(details.id);

    details.status = EmergencyAccessStatusType.RecoveryInitiated;
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("requestSent", this.userNamePipe.transform(details))
    );
  }

  async approve(details: EmergencyAccessGranteeView) {
    const type = this.i18nService.t(
      details.type === EmergencyAccessType.View ? "view" : "takeover"
    );

    const confirmed = await this.dialogService.openSimpleDialog({
      title: this.userNamePipe.transform(details),
      content: {
        key: "approveAccessConfirmation",
        placeholders: [this.userNamePipe.transform(details), type],
      },
      acceptButtonText: { key: "approve" },
      type: "warning",
    });

    if (!confirmed) {
      return false;
    }

    await this.emergencyAccessService.approve(details.id);
    details.status = EmergencyAccessStatusType.RecoveryApproved;

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("emergencyApproved", this.userNamePipe.transform(details))
    );
  }

  async reject(details: EmergencyAccessGranteeView) {
    await this.emergencyAccessService.reject(details.id);
    details.status = EmergencyAccessStatusType.Confirmed;

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("emergencyRejected", this.userNamePipe.transform(details))
    );
  }

  async takeover(details: EmergencyAccessGrantorView) {
    const [modal] = await this.modalService.openViewRef(
      EmergencyAccessTakeoverComponent,
      this.takeoverModalRef,
      (comp) => {
        comp.name = this.userNamePipe.transform(details);
        comp.email = details.email;
        comp.emergencyAccessId = details != null ? details.id : null;

        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        comp.onDone.subscribe(() => {
          modal.close();
          this.platformUtilsService.showToast(
            "success",
            null,
            this.i18nService.t("passwordResetFor", this.userNamePipe.transform(details))
          );
        });
      }
    );
  }

  private removeGrantee(details: EmergencyAccessGranteeView) {
    const index = this.trustedContacts.indexOf(details);
    if (index > -1) {
      this.trustedContacts.splice(index, 1);
    }
  }

  private removeGrantor(details: EmergencyAccessGrantorView) {
    const index = this.grantedContacts.indexOf(details);
    if (index > -1) {
      this.grantedContacts.splice(index, 1);
    }
  }
}
