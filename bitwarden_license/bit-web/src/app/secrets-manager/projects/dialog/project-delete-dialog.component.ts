import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  Validators,
  ValidationErrors,
  ValidatorFn,
  AbstractControl,
} from "@angular/forms";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { DialogService } from "@bitwarden/components";

import {
  BulkOperationStatus,
  BulkStatusDetails,
  BulkStatusDialogComponent,
} from "../../layout/dialogs/bulk-status-dialog.component";
import { ProjectListView } from "../../models/view/project-list.view";
import { ProjectService } from "../project.service";

export interface ProjectDeleteOperation {
  projects: ProjectListView[];
}

@Component({
  selector: "sm-project-delete-dialog",
  templateUrl: "./project-delete-dialog.component.html",
})
export class ProjectDeleteDialogComponent implements OnInit {
  formGroup = new FormGroup({
    confirmDelete: new FormControl("", [
      Validators.required,
      this.matchConfirmationMessageValidator(),
    ]),
  });

  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: ProjectDeleteOperation,
    private projectService: ProjectService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    if (!(this.data.projects?.length >= 1)) {
      this.dialogRef.close();
      throw new Error(
        "The project delete dialog was not called with the appropriate operation values."
      );
    }
  }

  get title() {
    return this.data.projects.length === 1 ? "deleteProject" : "deleteProjects";
  }

  get dialogContent() {
    return this.data.projects.length === 1
      ? this.i18nService.t("deleteProjectDialogMessage", this.data.projects[0].name)
      : this.i18nService.t("deleteProjectsDialogMessage");
  }

  get dialogConfirmationLabel() {
    return this.i18nService.t("deleteProjectInputLabel", this.dialogConfirmationMessage);
  }

  submit = async () => {
    if (this.formGroup.invalid) {
      return;
    }

    await this.delete();
    this.dialogRef.close();
  };

  async delete() {
    const bulkResponses = await this.projectService.delete(this.data.projects);

    if (bulkResponses.find((response) => response.errorMessage)) {
      this.openBulkStatusDialog(bulkResponses.filter((response) => response.errorMessage));
      return;
    }

    const message = this.data.projects.length === 1 ? "deleteProjectToast" : "deleteProjectsToast";
    this.platformUtilsService.showToast("success", null, this.i18nService.t(message));
  }

  openBulkStatusDialog(bulkStatusResults: BulkOperationStatus[]) {
    this.dialogService.open<unknown, BulkStatusDetails>(BulkStatusDialogComponent, {
      data: {
        title: "deleteProjects",
        subTitle: "projects",
        columnTitle: "projectName",
        message: "bulkDeleteProjectsErrorMessage",
        details: bulkStatusResults,
      },
    });
  }

  private get dialogConfirmationMessage() {
    return this.data.projects?.length === 1
      ? this.i18nService.t("deleteProjectConfirmMessage", this.data.projects[0].name)
      : this.i18nService.t("deleteProjectsConfirmMessage", this.data.projects?.length.toString());
  }

  private matchConfirmationMessageValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (this.dialogConfirmationMessage.toLowerCase() == control.value.toLowerCase()) {
        return null;
      } else {
        return {
          confirmationDoesntMatchError: {
            message: this.i18nService.t("smConfirmationRequired"),
          },
        };
      }
    };
  }
}
