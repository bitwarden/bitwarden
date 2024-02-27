import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { BillingAccountProfileStateServiceAbstraction } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service.abstraction";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

@Component({
  selector: "app-tools",
  templateUrl: "tools.component.html",
})
export class ToolsComponent implements OnInit, OnDestroy {
  private componentIsDestroyed$ = new Subject<boolean>();
  canAccessPremium = false;

  constructor(
    private messagingService: MessagingService,
    private billingAccountProfileStateService: BillingAccountProfileStateServiceAbstraction,
  ) {}

  async ngOnInit() {
    this.billingAccountProfileStateService.canAccessPremium$
      .pipe(takeUntil(this.componentIsDestroyed$))
      .subscribe((canAccessPremium: boolean) => {
        this.canAccessPremium = canAccessPremium;
      });
  }

  ngOnDestroy() {
    this.componentIsDestroyed$.next(true);
    this.componentIsDestroyed$.complete();
  }

  premiumRequired() {
    if (!this.canAccessPremium) {
      this.messagingService.send("premiumRequired");
      return;
    }
  }
}
