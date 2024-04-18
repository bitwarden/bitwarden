import { Observable, Subject, filter, map, merge, share, tap } from "rxjs";
import { Jsonify } from "type-fest";

import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { KeyGenerationService } from "@bitwarden/common/platform/abstractions/key-generation.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
  ObservableStorageService,
  StorageUpdate,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { MemoryStorageOptions } from "@bitwarden/common/platform/models/domain/storage-options";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";

import { BrowserApi } from "../browser/browser-api";
import { fromChromeEvent } from "../browser/from-chrome-event";
import { devFlag } from "../decorators/dev-flag.decorator";
import { devFlagEnabled } from "../flags";

export class LocalBackedSessionStorageService
  extends AbstractMemoryStorageService
  implements ObservableStorageService
{
  private cache: Record<string, unknown> = {};
  private updatesSubject = new Subject<StorageUpdate>();

  private commandName = `localBackedSessionStorage_${this.name}`;
  private getCommandName = `${this.commandName}_get`;
  private updateCommandName = `${this.commandName}_update`;
  private encKey = `localEncryptionKey_${this.name}`;
  private sessionKey = `session_${this.name}`;

  updates$: Observable<StorageUpdate>;

  constructor(
    private encryptService: EncryptService,
    private keyGenerationService: KeyGenerationService,
    private localStorage: AbstractStorageService,
    private sessionStorage: AbstractStorageService,
    private name: string,
  ) {
    super();

    void this.initializeCache();

    const remoteUpdatesObservable = fromChromeEvent(chrome.runtime.onMessage).pipe(
      filter(([msg]) => msg.command === this.updateCommandName),
      map(([msg]) => msg.update as StorageUpdate),
      tap((update) => {
        const { key, updateType, value } = update;
        if (updateType === "remove") {
          this.cache[update.key] = null;
          return;
        }

        if (!value) {
          return;
        }

        this.cache[key] = JSON.parse(value);
        this.updatesSubject.next({ key, updateType });
      }),
      share(),
    );
    remoteUpdatesObservable.subscribe();
    this.updates$ = merge(this.updatesSubject.asObservable(), remoteUpdatesObservable);

    const remoteGetCacheObservable = fromChromeEvent(chrome.runtime.onMessage).pipe(
      filter(([msg]) => msg.command === this.getCommandName),
      tap(([msg, _sender, sendResponse]) => {
        const { cacheKey } = msg;
        if (!cacheKey || !this.cache[cacheKey]) {
          return;
        }

        sendResponse(JSON.stringify(this.cache[cacheKey]));
      }),
      share(),
    );
    remoteGetCacheObservable.subscribe();
  }

  get valuesRequireDeserialization(): boolean {
    return true;
  }

  async get<T>(key: string, options?: MemoryStorageOptions<T>): Promise<T> {
    if (this.cache[key] !== undefined) {
      if (this.cache[key] === null) {
        return null;
      }

      return this.cache[key] as T;
    }

    const externalContextCacheValue = await this.getCachedValueFromExternalContext(key);
    if (externalContextCacheValue) {
      this.cache[key] = JSON.parse(externalContextCacheValue);
      this.updatesSubject.next({ key, updateType: "save" });
      return externalContextCacheValue as T;
    }

    return await this.getBypassCache(key, options);
  }

  async getBypassCache<T>(key: string, options?: MemoryStorageOptions<T>): Promise<T> {
    const session = await this.getLocalSession(await this.getSessionEncKey());

    if (session == null || !Object.keys(session).includes(key)) {
      void this.save(key, null);
      return null;
    }

    let value = session[key];
    if (options?.deserializer != null) {
      value = options.deserializer(value as Jsonify<T>);
    }

    this.cache[key] = JSON.parse(JSON.stringify(value));
    return value as T;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) != null;
  }

  async save<T>(key: string, obj: T): Promise<void> {
    if (obj == null) {
      return await this.remove(key);
    }

    const existingValue = this.cache[key];
    if (this.compareValues<T>(existingValue as T, obj)) {
      return;
    }

    const externalContextCacheValue = await this.getCachedValueFromExternalContext(key);
    if (this.compareValues<T>(externalContextCacheValue, obj)) {
      this.cache[key] = JSON.parse(externalContextCacheValue);
      this.updatesSubject.next({ key, updateType: "save" });
      return;
    }

    this.cache[key] = obj;
    await this.updateLocalSessionValue(key, obj);
    this.sendUpdate({ key, updateType: "save", value: JSON.stringify(obj) });
  }

  async remove(key: string): Promise<void> {
    const existingValue = this.cache[key];
    if (existingValue === null) {
      return;
    }

    this.cache[key] = null;
    await this.updateLocalSessionValue(key, null);
    this.sendUpdate({ key, updateType: "remove" });
  }

  sendUpdate(storageUpdate: StorageUpdate) {
    this.updatesSubject.next(storageUpdate);
    void chrome.runtime.sendMessage({
      command: this.updateCommandName,
      update: storageUpdate,
    });
  }

  private async updateLocalSessionValue<T>(key: string, obj: T) {
    const sessionEncKey = await this.getSessionEncKey();
    const localSession = (await this.getLocalSession(sessionEncKey)) ?? {};
    localSession[key] = obj;
    await this.setLocalSession(localSession, sessionEncKey);
  }

  async getLocalSession(encKey: SymmetricCryptoKey): Promise<Record<string, unknown>> {
    // if the cache is not empty
    if (Object.keys(this.cache).length > 0) {
      return this.cache;
    }

    const local = await this.localStorage.get<string>(this.sessionKey);

    if (local == null) {
      return null;
    }

    if (devFlagEnabled("storeSessionDecrypted")) {
      return local as any as Record<string, unknown>;
    }

    const sessionJson = await this.encryptService.decryptToUtf8(new EncString(local), encKey);
    if (sessionJson == null) {
      // Error with decryption -- session is lost, delete state and key and start over
      await this.setSessionEncKey(null);
      await this.localStorage.remove(this.sessionKey);
      return null;
    }
    return JSON.parse(sessionJson);
  }

  async setLocalSession(session: Record<string, unknown>, key: SymmetricCryptoKey) {
    if (devFlagEnabled("storeSessionDecrypted")) {
      await this.setDecryptedLocalSession(session);
    } else {
      await this.setEncryptedLocalSession(session, key);
    }
  }

  @devFlag("storeSessionDecrypted")
  async setDecryptedLocalSession(session: Record<string, unknown>): Promise<void> {
    // Make sure we're storing the jsonified version of the session
    const jsonSession = JSON.parse(JSON.stringify(session));
    if (session == null) {
      await this.localStorage.remove(this.sessionKey);
    } else {
      await this.localStorage.save(this.sessionKey, jsonSession);
    }
  }

  async setEncryptedLocalSession(session: Record<string, unknown>, key: SymmetricCryptoKey) {
    const jsonSession = JSON.stringify(session);
    const encSession = await this.encryptService.encrypt(jsonSession, key);

    if (encSession == null) {
      return await this.localStorage.remove(this.sessionKey);
    }
    await this.localStorage.save(this.sessionKey, encSession.encryptedString);
  }

  async getSessionEncKey(): Promise<SymmetricCryptoKey> {
    let storedKey = await this.sessionStorage.get<SymmetricCryptoKey>(this.encKey);
    if (storedKey == null || Object.keys(storedKey).length == 0) {
      const generatedKey = await this.keyGenerationService.createKeyWithPurpose(
        128,
        "ephemeral",
        "bitwarden-ephemeral",
      );
      storedKey = generatedKey.derivedKey;
      await this.setSessionEncKey(storedKey);
      return storedKey;
    } else {
      return SymmetricCryptoKey.fromJSON(storedKey);
    }
  }

  async setSessionEncKey(input: SymmetricCryptoKey): Promise<void> {
    if (input == null) {
      await this.sessionStorage.remove(this.encKey);
    } else {
      await this.sessionStorage.save(this.encKey, input);
    }
  }

  private async getCachedValueFromExternalContext(cacheKey: string): Promise<string> {
    return await BrowserApi.sendMessageWithResponse(this.getCommandName, { cacheKey });
  }

  private compareValues<T>(value1: string | T, value2: T): boolean {
    if (typeof value1 !== "string" || typeof value1 !== "object" || typeof value2 !== "object") {
      return value1 === value2;
    }

    if (value1 === JSON.stringify(value2)) {
      return true;
    }

    let parsedValue1 = value1;
    if (typeof value1 === "string") {
      parsedValue1 = JSON.parse(value1);
    }
    if (parsedValue1 == null) {
      return false;
    }

    return Object.entries(value1).sort().toString() === Object.entries(value2).sort().toString();
  }

  private async initializeCache() {
    const localSession = await this.getLocalSession(await this.getSessionEncKey());
    if (localSession == null) {
      return;
    }

    this.cache = localSession || {};
  }
}
