import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { TemplatePortal } from "@angular/cdk/portal";
import { Component, Input, OnInit, TemplateRef, ViewChild, ViewContainerRef } from "@angular/core";

@Component({
  selector: "vault-carousel-slide",
  templateUrl: "./carousel-slide.component.html",
  standalone: true,
})
export class VaultCarouselSlideComponent implements OnInit {
  /** `aria-label` that is assigned to the carousel toggle. */
  @Input({ required: true }) label!: string;

  /**
   * Should be set to true when the slide has no focusable elements.
   *
   * When the slide does not contain any focusable elements or the first element with content is not focusable,
   * this should be set to 0 to include it in the tab sequence of the page.
   *
   * @remarks See note 4 of https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/
   */
  @Input({ transform: coerceBooleanProperty }) noFocusableChildren?: true;

  @ViewChild(TemplateRef, { static: true }) implicitContent!: TemplateRef<unknown>;

  private _contentPortal: TemplatePortal | null = null;

  get content(): TemplatePortal | null {
    return this._contentPortal;
  }

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnInit(): void {
    this._contentPortal = new TemplatePortal(this.implicitContent, this.viewContainerRef);
  }
}
