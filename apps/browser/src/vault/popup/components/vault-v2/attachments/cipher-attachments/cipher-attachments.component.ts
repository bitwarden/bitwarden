import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { Cipher } from "@bitwarden/common/vault/models/domain/cipher";
import { AttachmentView } from "@bitwarden/common/vault/models/view/attachment.view";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  AsyncActionsModule,
  BitSubmitDirective,
  ButtonModule,
  CardComponent,
  ToastService,
  TypographyModule,
} from "@bitwarden/components";

import { DeleteAttachmentComponent } from "./delete-attachment/delete-attachment.component";
import { DownloadAttachmentComponent } from "./download-attachment/download-attachment.component";

type CipherAttachmentForm = FormGroup<{
  file: FormControl<File | null>;
}>;

@Component({
  standalone: true,
  selector: "app-cipher-attachments",
  templateUrl: "./cipher-attachments.component.html",
  imports: [
    AsyncActionsModule,
    ButtonModule,
    CommonModule,
    JslibModule,
    ReactiveFormsModule,
    TypographyModule,
    CardComponent,
    DeleteAttachmentComponent,
    DownloadAttachmentComponent,
  ],
})
export class CipherAttachmentsComponent implements OnInit, AfterViewInit {
  /** `id` associated with the form element */
  static attachmentFormID = "attachmentForm";

  /** Reference to the file HTMLInputElement */
  @ViewChild("fileInput", { read: ElementRef }) private fileInput: ElementRef<HTMLInputElement>;

  /** Reference to the BitSubmitDirective */
  @ViewChild(BitSubmitDirective) bitSubmit: BitSubmitDirective;

  /** The `id` of the cipher in context */
  @Input({ required: true }) cipherId: string;

  /** Emits the status of the attachment form */
  @Output() formStatusChange = new EventEmitter<FormControlStatus>();

  /** Emits the `BitSubmitDirective` loading state */
  @Output() formLoading = new EventEmitter<boolean>();

  /** Emits the `BitSubmitDirective` disabled state */
  @Output() formDisabled = new EventEmitter<boolean>();

  /** Emits after a file has been successfully uploaded */
  @Output() onUploadSuccess = new EventEmitter<void>();

  cipher: CipherView;

  attachmentForm: CipherAttachmentForm = this.formBuilder.group({
    file: new FormControl<File>(null, [Validators.required]),
  });

  private cipherDomain: Cipher;
  private destroy$ = inject(DestroyRef);

  constructor(
    private cipherService: CipherService,
    private i18nService: I18nService,
    private formBuilder: FormBuilder,
    private logService: LogService,
    private toastService: ToastService,
  ) {
    this.attachmentForm.statusChanges.pipe(takeUntilDestroyed()).subscribe((status) => {
      this.formStatusChange.emit(status);
    });
  }

  async ngOnInit(): Promise<void> {
    this.cipherDomain = await this.cipherService.get(this.cipherId);
    this.cipher = await this.cipherDomain.decrypt(
      await this.cipherService.getKeyForCipherKeyDecryption(this.cipherDomain),
    );
  }

  ngAfterViewInit(): void {
    this.bitSubmit.loading$.pipe(takeUntilDestroyed(this.destroy$)).subscribe((loading) => {
      this.formLoading.emit(loading);
    });

    this.bitSubmit.disabled$.pipe(takeUntilDestroyed(this.destroy$)).subscribe((disabled) => {
      this.formDisabled.emit(disabled);
    });
  }

  /** Reference the `id` via the static property */
  get attachmentFormId(): string {
    return CipherAttachmentsComponent.attachmentFormID;
  }

  /** Updates the form value when a file is selected */
  onFileChange(event: Event): void {
    const fileInputEl = event.target as HTMLInputElement;

    if (fileInputEl.files && fileInputEl.files.length > 0) {
      this.attachmentForm.controls.file.setValue(fileInputEl.files[0]);
    }
  }

  /** Save the attachments to the cipher */
  submit = async () => {
    const file = this.attachmentForm.value.file;
    if (file === null) {
      this.toastService.showToast({
        variant: "error",
        title: this.i18nService.t("errorOccurred"),
        message: this.i18nService.t("selectFile"),
      });
      return;
    }

    if (file.size > 524288000) {
      // 500 MB
      this.toastService.showToast({
        variant: "error",
        title: this.i18nService.t("errorOccurred"),
        message: this.i18nService.t("maxFileSize"),
      });
      return;
    }

    try {
      this.cipherDomain = await this.cipherService.saveAttachmentWithServer(
        this.cipherDomain,
        file,
      );

      // re-decrypt the cipher to update the attachments
      this.cipher = await this.cipherDomain.decrypt(
        await this.cipherService.getKeyForCipherKeyDecryption(this.cipherDomain),
      );

      // Reset reactive form and input element
      this.fileInput.nativeElement.value = "";
      this.attachmentForm.controls.file.setValue(null);

      this.toastService.showToast({
        variant: "success",
        title: null,
        message: this.i18nService.t("attachmentSaved"),
      });

      this.onUploadSuccess.emit();
    } catch (e) {
      if (e.message === "This organization cannot use attachments.") {
        this.toastService.showToast({
          variant: "error",
          title: null,
          message: this.i18nService.t("freeOrgsCannotUseAttachments"),
        });
      }
      this.logService.error(e);
    }
  };

  /** Removes the attachment from the cipher */
  removeAttachment(attachment: AttachmentView) {
    const index = this.cipher.attachments.indexOf(attachment);

    if (index > -1) {
      this.cipher.attachments.splice(index, 1);
    }
  }
}
