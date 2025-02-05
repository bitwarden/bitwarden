// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Injectable } from "@angular/core";
import { IndividualConfig, ToastContainerDirective, ToastrService } from "ngx-toastr";

import type { ToastComponent } from "./toast.component";
import { calculateToastTimeout } from "./utils";

export type ToastOptions = {
  /**
   * The duration the toast will persist in milliseconds
   **/
  timeout?: number;
} & Pick<ToastComponent, "message" | "variant" | "title">;

/**
 * Presents toast notifications
 **/
@Injectable({ providedIn: "root" })
export class ToastService {
  constructor(private toastrService: ToastrService) {}

  showToast(options: ToastOptions): void {
    const toastrConfig: Partial<IndividualConfig> = {
      payload: {
        message: options.message,
        variant: options.variant,
        title: options.title,
      },
      timeOut:
        options.timeout != null && options.timeout > 0
          ? options.timeout
          : calculateToastTimeout(options.message),
    };

    this.toastrService.show(null, options.title, toastrConfig);
  }

  set overlayContainer(container: ToastContainerDirective) {
    this.toastrService.overlayContainer = container;
  }

  /**
   * @deprecated use `showToast` instead
   *
   * Converts options object from PlatformUtilsService
   **/
  _showToast(options: {
    type: "error" | "success" | "warning" | "info";
    title: string;
    text: string | string[];
    options?: {
      timeout?: number;
    };
  }) {
    this.showToast({
      message: options.text,
      variant: options.type,
      title: options.title,
      timeout: options.options?.timeout,
    });
  }
}
