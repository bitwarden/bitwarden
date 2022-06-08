import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { UserNamePipe } from "@bitwarden/angular/src/pipes/user-name.pipe";
import { ApiService } from "@bitwarden/common/src/abstractions/api.service";
import { ExportService } from "@bitwarden/common/src/abstractions/export.service";
import { I18nService } from "@bitwarden/common/src/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/src/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";
import { ProviderService } from "@bitwarden/common/src/abstractions/provider.service";
import { EventResponse } from "@bitwarden/common/src/models/response/eventResponse";

import { BaseEventsComponent } from "src/app/common/base.events.component";
import { EventService } from "src/app/services/event.service";

@Component({
  selector: "provider-events",
  templateUrl: "events.component.html",
})
export class EventsComponent extends BaseEventsComponent implements OnInit {
  exportFileName = "provider-events";
  providerId: string;

  private providerUsersUserIdMap = new Map<string, any>();
  private providerUsersIdMap = new Map<string, any>();

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    eventService: EventService,
    i18nService: I18nService,
    private providerService: ProviderService,
    exportService: ExportService,
    platformUtilsService: PlatformUtilsService,
    private router: Router,
    logService: LogService,
    private userNamePipe: UserNamePipe
  ) {
    super(eventService, i18nService, exportService, platformUtilsService, logService);
  }

  async ngOnInit() {
    this.route.parent.parent.params.subscribe(async (params) => {
      this.providerId = params.providerId;
      const provider = await this.providerService.get(this.providerId);
      if (provider == null || !provider.useEvents) {
        this.router.navigate(["/providers", this.providerId]);
        return;
      }
      await this.load();
    });
  }

  async load() {
    const response = await this.apiService.getProviderUsers(this.providerId);
    response.data.forEach((u) => {
      const name = this.userNamePipe.transform(u);
      this.providerUsersIdMap.set(u.id, { name: name, email: u.email });
      this.providerUsersUserIdMap.set(u.userId, { name: name, email: u.email });
    });
    await this.loadEvents(true);
    this.loaded = true;
  }

  protected requestEvents(startDate: string, endDate: string, continuationToken: string) {
    return this.apiService.getEventsProvider(
      this.providerId,
      startDate,
      endDate,
      continuationToken
    );
  }

  protected getUserName(r: EventResponse, userId: string) {
    return userId != null && this.providerUsersUserIdMap.has(userId)
      ? this.providerUsersUserIdMap.get(userId)
      : null;
  }
}
