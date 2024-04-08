import { VaultTimeoutSettingsService as AbstractVaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { VaultTimeoutSettingsService } from "@bitwarden/common/services/vault-timeout/vault-timeout-settings.service";

import {
  policyServiceFactory,
  PolicyServiceInitOptions,
} from "../../admin-console/background/service-factories/policy-service.factory";
import {
  tokenServiceFactory,
  TokenServiceInitOptions,
} from "../../auth/background/service-factories/token-service.factory";
import {
  userDecryptionOptionsServiceFactory,
  UserDecryptionOptionsServiceInitOptions,
} from "../../auth/background/service-factories/user-decryption-options-service.factory";
import {
  biometricStateServiceFactory,
  BiometricStateServiceInitOptions,
} from "../../platform/background/service-factories/biometric-state-service.factory";
import {
  CryptoServiceInitOptions,
  cryptoServiceFactory,
} from "../../platform/background/service-factories/crypto-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../platform/background/service-factories/factory-options";
import {
  logServiceFactory,
  LogServiceInitOptions,
} from "../../platform/background/service-factories/log-service.factory";
import {
  StateProviderInitOptions,
  stateProviderFactory,
} from "../../platform/background/service-factories/state-provider.factory";
import {
  StateServiceInitOptions,
  stateServiceFactory,
} from "../../platform/background/service-factories/state-service.factory";

type VaultTimeoutSettingsServiceFactoryOptions = FactoryOptions;

export type VaultTimeoutSettingsServiceInitOptions = VaultTimeoutSettingsServiceFactoryOptions &
  UserDecryptionOptionsServiceInitOptions &
  CryptoServiceInitOptions &
  TokenServiceInitOptions &
  PolicyServiceInitOptions &
  StateServiceInitOptions &
  BiometricStateServiceInitOptions &
  StateProviderInitOptions &
  LogServiceInitOptions;

export function vaultTimeoutSettingsServiceFactory(
  cache: { vaultTimeoutSettingsService?: AbstractVaultTimeoutSettingsService } & CachedServices,
  opts: VaultTimeoutSettingsServiceInitOptions,
): Promise<AbstractVaultTimeoutSettingsService> {
  return factory(
    cache,
    "vaultTimeoutSettingsService",
    opts,
    async () =>
      new VaultTimeoutSettingsService(
        await userDecryptionOptionsServiceFactory(cache, opts),
        await cryptoServiceFactory(cache, opts),
        await tokenServiceFactory(cache, opts),
        await policyServiceFactory(cache, opts),
        await stateServiceFactory(cache, opts),
        await biometricStateServiceFactory(cache, opts),
        await stateProviderFactory(cache, opts),
        await logServiceFactory(cache, opts),
      ),
  );
}
