import { DevicesApiServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices-api.service.abstraction";
import { DevicesApiServiceImplementation } from "@bitwarden/common/services/devices/devices-api.service.implementation";

import {
  ApiServiceInitOptions,
  apiServiceFactory,
} from "../../platform/background/service-factories/api-service.factory";
import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../platform/background/service-factories/factory-options";

type DevicesApiServiceFactoryOptions = FactoryOptions;

export type DevicesApiServiceInitOptions = DevicesApiServiceFactoryOptions & ApiServiceInitOptions;

export function devicesApiServiceFactory(
  cache: { DevicesApiService?: DevicesApiServiceAbstraction } & CachedServices,
  opts: DevicesApiServiceInitOptions
): Promise<DevicesApiServiceAbstraction> {
  return factory(
    cache,
    "DevicesApiService",
    opts,
    async () => new DevicesApiServiceImplementation(await apiServiceFactory(cache, opts))
  );
}
