import { Region } from "@bitwarden/common/platform/abstractions/environment.service";
// FIXME: remove `src` and fix import
// eslint-disable-next-line no-restricted-imports
import { VaultTimeoutAction } from "@bitwarden/common/src/enums/vault-timeout-action.enum";
import { VaultTimeout } from "@bitwarden/common/types/vault-timeout.type";
import { CipherType } from "@bitwarden/common/vault/enums";

export type UserSettings = {
  avatarColor: string | null;
  environmentUrls: {
    api: string | null;
    base: string | null;
    events: string | null;
    icons: string | null;
    identity: string | null;
    keyConnector: string | null;
    notifications: string | null;
    webVault: string | null;
  };
  pinProtected: { [key: string]: any };
  region: Region;
  serverConfig: {
    environment: {
      api: string | null;
      cloudRegion: string | null;
      identity: string | null;
      notifications: string | null;
      sso: string | null;
      vault: string | null;
    };
    featureStates: { [key: string]: any };
    gitHash: string;
    server: { [key: string]: any };
    utcDate: string;
    version: string;
  };
  vaultTimeout: VaultTimeout;
  vaultTimeoutAction: VaultTimeoutAction;
};

/**
 * A HTMLElement (usually a form element) with additional custom properties added by this script
 */
export type ElementWithOpId<T> = T & {
  opid: string;
};

/**
 * A Form Element that we can set a value on (fill)
 */
export type FillableFormFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * The autofill script's definition of a Form Element (only a subset of HTML form elements)
 */
export type FormFieldElement = FillableFormFieldElement | HTMLSpanElement;

export type FormElementWithAttribute = FormFieldElement & Record<string, string | null | undefined>;

export type AutofillCipherTypeId = CipherType.Login | CipherType.Card | CipherType.Identity;
