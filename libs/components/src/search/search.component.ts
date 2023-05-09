import { Component, Input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

let nextId = 0;

@Component({
  selector: "bit-search",
  templateUrl: "./search.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SearchComponent,
    },
  ],
  styles: [
    `
      input[type="search"]::-webkit-search-cancel-button {
        -webkit-appearance: none;
        appearance: none;
        height: 21px;
        width: 21px;
        margin: 0;
        cursor: pointer;
        background-repeat: no-repeat;
        mask-image: url("./close-button-white.svg");
        -webkit-mask-image: url("./close-button-white.svg");
        background-color: rgba(var(--color-text-muted));
      }

      input[type="search"]::-webkit-search-cancel-button:hover {
        background-color: rgba(var(--color-text-main));
      }
    `,
  ],
})
export class SearchComponent implements ControlValueAccessor {
  private notifyOnChange: (v: string) => void;
  private notifyOnTouch: () => void;

  protected id = `search-id-${nextId++}`;
  protected searchText: string;

  @Input() disabled: boolean;
  @Input() placeholder: string;

  onChange(searchText: string) {
    if (this.notifyOnChange != undefined) {
      this.notifyOnChange(searchText);
    }
  }

  onTouch() {
    if (this.notifyOnTouch != undefined) {
      this.notifyOnTouch();
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.notifyOnChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyOnTouch = fn;
  }

  writeValue(searchText: string): void {
    this.searchText = searchText;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
