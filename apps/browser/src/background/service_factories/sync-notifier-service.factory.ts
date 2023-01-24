import { SyncNotifierService as AbstractSyncNotifierService } from "@bitwarden/common/vault/abstractions/sync/sync-notifier.service.abstraction";
import { SyncNotifierService } from "@bitwarden/common/vault/services/sync/syncNotifier.service";

import { FactoryOptions, CachedServices, factory } from "./factory-options";

type SyncNotifierServiceFactoryOptions = FactoryOptions;

export type SyncNotifierServiceInitOptions = SyncNotifierServiceFactoryOptions;

export function syncNotifierServiceFactory(
  cache: { syncNotifierService?: AbstractSyncNotifierService } & CachedServices,
  opts: SyncNotifierServiceInitOptions
): Promise<AbstractSyncNotifierService> {
  return factory(cache, "syncNotifierService", opts, () =>
    Promise.resolve(new SyncNotifierService())
  );
}
