import { Injectable } from "@angular/core";

import { BroadcasterService } from "@bitwarden/common/src/abstractions/broadcaster.service";
import { MessagingService } from "@bitwarden/common/src/abstractions/messaging.service";

@Injectable()
export class BroadcasterMessagingService implements MessagingService {
  constructor(private broadcasterService: BroadcasterService) {}

  send(subscriber: string, arg: any = {}) {
    const message = Object.assign({}, { command: subscriber }, arg);
    this.broadcasterService.send(message);
  }
}
