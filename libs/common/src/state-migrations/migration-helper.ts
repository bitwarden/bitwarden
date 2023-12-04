// eslint-disable-next-line import/no-restricted-paths -- Needed to print log messages
import { LogService } from "../platform/abstractions/log.service";
// eslint-disable-next-line import/no-restricted-paths -- Needed to interface with storage locations
import { AbstractStorageService } from "../platform/abstractions/storage.service";

export class MigrationHelper {
  constructor(
    public currentVersion: number,
    private storageService: AbstractStorageService,
    public logService: LogService,
  ) {}

  get<T>(key: string): Promise<T> {
    return this.storageService.get<T>(key);
  }

  set<T>(key: string, value: T): Promise<void> {
    this.logService.info(`Setting ${key}`);
    return this.storageService.save(key, value);
  }

  /**
   * Gets a globally scoped value from a location derived through the key definition
   *
   * This is for use with the state providers framework, DO NOT use for values stored with {@link StateService},
   * use {@link get} for those.
   * @param keyDefinition unique key definition
   * @returns value from store
   */
  getFromGlobal<T>(keyDefinition: { stateDefinition: { name: string }; key: string }): Promise<T> {
    return this.get<T>(this.getGlobalKey(keyDefinition));
  }

  /**
   * Sets a globally scoped value to a location derived through the key definition
   *
   * This is for use with the state providers framework, DO NOT use for values stored with {@link StateService},
   * use {@link set} for those.
   * @param keyDefinition unique key definition
   * @param value value to store
   * @returns void
   */
  setToGlobal<T>(
    keyDefinition: { stateDefinition: { name: string }; key: string },
    value: T,
  ): Promise<void> {
    return this.set(this.getGlobalKey(keyDefinition), value);
  }

  /**
   * Gets a user scoped value from a location derived through the user id and key definition
   *
   * This is for use with the state providers framework, DO NOT use for values stored with {@link StateService},
   * use {@link get} for those.
   * @param userId userId to use in the key
   * @param keyDefinition unique key definition
   * @returns value from store
   */
  getFromUser<T>(
    userId: string,
    keyDefinition: { stateDefinition: { name: string }; key: string },
  ): Promise<T> {
    return this.get<T>(this.getUserKey(userId, keyDefinition));
  }

  /**
   * Sets a user scoped value to a location derived through the user id and key definition
   *
   * This is for use with the state providers framework, DO NOT use for values stored with {@link StateService},
   * use {@link set} for those.
   * @param userId userId to use in the key
   * @param keyDefinition unique key definition
   * @param value value to store
   * @returns void
   */
  setToUser<T>(
    userId: string,
    keyDefinition: { stateDefinition: { name: string }; key: string },
    value: T,
  ): Promise<void> {
    return this.set(this.getUserKey(userId, keyDefinition), value);
  }

  info(message: string): void {
    this.logService.info(message);
  }

  async getAccounts<ExpectedAccountType>(): Promise<
    { userId: string; account: ExpectedAccountType }[]
  > {
    const userIds = (await this.get<string[]>("authenticatedAccounts")) ?? [];
    return Promise.all(
      userIds.map(async (userId) => ({
        userId,
        account: await this.get<ExpectedAccountType>(userId),
      })),
    );
  }

  /**
   * Builds a user storage key appropriate for the current version.
   *
   * @param userId userId to use in the key
   * @param keyDefinition state and key to use in the key
   * @returns
   */
  private getUserKey(
    userId: string,
    keyDefinition: {
      stateDefinition: { name: string };
      key: string;
    },
  ): string {
    if (this.currentVersion < 10) {
      return userKeyBuilderPre10();
    } else {
      return userKeyBuilder(userId, keyDefinition);
    }
  }

  /**
   * Builds a global storage key appropriate for the current version.
   *
   * @param keyDefinition state and key to use in the key
   * @returns
   */
  private getGlobalKey(keyDefinition: { stateDefinition: { name: string }; key: string }): string {
    if (this.currentVersion < 10) {
      return globalKeyBuilderPre10();
    } else {
      return globalKeyBuilder(keyDefinition);
    }
  }
}

/**
 * When this is updated, rename this function to `userKeyBuilderXToY` where `X` is the version number it
 * became relevant, and `Y` prior to the version it was updated.
 *
 * Be sure to update the map in `MigrationHelper` to point to the appropriate function for the current version.
 * @param userId The userId of the user you want the key to be for.
 * @param keyDefinition the key definition of which data the key should point to.
 * @returns
 */
function userKeyBuilder(
  userId: string,
  keyDefinition: { stateDefinition: { name: string }; key: string },
): string {
  return `user_${userId}_${keyDefinition.stateDefinition.name}_${keyDefinition.key}`;
}

function userKeyBuilderPre10(): string {
  throw Error("No key builder should be used for versions prior to 10.");
}

/**
 * When this is updated, rename this function to `globalKeyBuilderXToY` where `X` is the version number
 * it became relevant, and `Y` prior to the version it was updated.
 *
 * Be sure to update the map in `MigrationHelper` to point to the appropriate function for the current version.
 * @param keyDefinition the key definition of which data the key should point to.
 * @returns
 */
function globalKeyBuilder(keyDefinition: {
  stateDefinition: { name: string };
  key: string;
}): string {
  return `global_${keyDefinition.stateDefinition.name}_${keyDefinition.key}`;
}

function globalKeyBuilderPre10(): string {
  throw Error("No key builder should be used for versions prior to 10.");
}
