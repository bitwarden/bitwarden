import { Component, ViewChild } from "@angular/core";

import { MenuComponent } from "@bitwarden/components";

import { ProductSwitcherService } from "./shared/product-switcher.service";

@Component({
  selector: "product-switcher-content",
  templateUrl: "./product-switcher-content.component.html",
})
export class ProductSwitcherContentComponent {
  @ViewChild("menu")
  menu: MenuComponent;

  constructor(private productSwitcherService: ProductSwitcherService) {}

  protected readonly products$ = this.productSwitcherService.products$;
}
