import { DatePipe } from "@angular/common";
import { Component } from "@angular/core";

import { AddEditComponent as BaseAddEditComponent } from "@bitwarden/angular/src/components/send/add-edit.component";
import { EnvironmentService } from "@bitwarden/common/src/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/src/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/src/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/src/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/src/abstractions/policy.service";
import { SendService } from "@bitwarden/common/src/abstractions/send.service";
import { StateService } from "@bitwarden/common/src/abstractions/state.service";

@Component({
  selector: "app-send-add-edit",
  templateUrl: "add-edit.component.html",
})
export class AddEditComponent extends BaseAddEditComponent {
  constructor(
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    environmentService: EnvironmentService,
    datePipe: DatePipe,
    sendService: SendService,
    stateService: StateService,
    messagingService: MessagingService,
    policyService: PolicyService,
    logService: LogService
  ) {
    super(
      i18nService,
      platformUtilsService,
      environmentService,
      datePipe,
      sendService,
      messagingService,
      policyService,
      logService,
      stateService
    );
  }

  async copyLinkToClipboard(link: string): Promise<void | boolean> {
    // Copy function on web depends on the modal being open or not. Since this event occurs during a transition
    // of the modal closing we need to add a small delay to make sure state of the DOM is consistent.
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(super.copyLinkToClipboard(link)), 500);
    });
  }
}
