import {
  AfterContentInit,
  Directive,
  EventEmitter,
  Host,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  Output,
} from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { BitIconButtonComponent } from "../icon-button/icon-button.component";

import { BitFormFieldComponent } from "./form-field.component";

@Directive({
  selector: "[bitPasswordInputToggle]",
})
export class BitPasswordInputToggleDirective implements AfterContentInit, OnChanges {
  /**
   * Whether the input is toggled to show the password.
   */
  @HostBinding("attr.aria-pressed") @Input() toggled = false;
  @Output() toggledChange = new EventEmitter<boolean>();

  @HostBinding("attr.title") title = this.i18nService.t("toggleVisibility");
  @HostBinding("attr.aria-label") label = this.i18nService.t("toggleVisibility");

  /**
   * Optional input control element to toggle the type of. If not provided, it will use the input element from the parent form field.
   * Primarily used for scenarios where the toggle button is used with an *ngIf directive and the parent form field may be unavailable.
   */
  @Input()
  passwordInput?: HTMLInputElement;

  get formFieldInput() {
    return this.passwordInput ?? this.formField.input;
  }

  /**
   * Click handler to toggle the state of the input type.
   */
  @HostListener("click") onClick() {
    this.toggled = !this.toggled;
    this.toggledChange.emit(this.toggled);

    this.update();

    this.formFieldInput?.focus();
  }

  constructor(
    @Host() private button: BitIconButtonComponent,
    private formField: BitFormFieldComponent,
    private i18nService: I18nService,
  ) {}

  get icon() {
    return this.toggled ? "bwi-eye-slash" : "bwi-eye";
  }

  ngOnChanges(): void {
    this.update();
  }

  ngAfterContentInit(): void {
    this.toggled = this.formFieldInput?.type !== "password";
    this.button.icon = this.icon;
  }

  private update() {
    this.button.icon = this.icon;
    if (this.formFieldInput?.type != null) {
      this.formFieldInput.type = this.toggled ? "text" : "password";
      this.formFieldInput.spellcheck = this.toggled ? false : undefined;
    }
  }
}
