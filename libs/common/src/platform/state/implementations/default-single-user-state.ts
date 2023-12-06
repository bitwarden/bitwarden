import {
  BehaviorSubject,
  Observable,
  defer,
  filter,
  firstValueFrom,
  shareReplay,
  switchMap,
  tap,
  timeout,
} from "rxjs";

import { UserId } from "../../../types/guid";
import { EncryptService } from "../../abstractions/encrypt.service";
import {
  AbstractStorageService,
  ObservableStorageService,
} from "../../abstractions/storage.service";
import { DerivedUserState } from "../derived-user-state";
import { KeyDefinition, userKeyBuilder } from "../key-definition";
import { StateUpdateOptions, populateOptionsWithDefault } from "../state-update-options";
import { Converter, SingleUserState } from "../user-state";

import { DefaultDerivedUserState } from "./default-derived-state";
import { getStoredValue } from "./util";
const FAKE_DEFAULT = Symbol("fakeDefault");

export class DefaultSingleUserState<T> implements SingleUserState<T> {
  private storageKey: string;

  protected stateSubject: BehaviorSubject<T | typeof FAKE_DEFAULT> = new BehaviorSubject<
    T | typeof FAKE_DEFAULT
  >(FAKE_DEFAULT);

  state$: Observable<T>;

  constructor(
    readonly userId: UserId,
    private keyDefinition: KeyDefinition<T>,
    private encryptService: EncryptService,
    private chosenLocation: AbstractStorageService & ObservableStorageService
  ) {
    this.storageKey = userKeyBuilder(this.userId, this.keyDefinition);

    const storageUpdates$ = this.chosenLocation.updates$.pipe(
      filter((update) => update.key === this.storageKey),
      switchMap(async (update) => {
        if (update.updateType === "remove") {
          return null;
        }
        return await getStoredValue(
          this.storageKey,
          this.chosenLocation,
          this.keyDefinition.deserializer
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.state$ = defer(() => {
      const storageUpdateSubscription = storageUpdates$.subscribe((value) => {
        this.stateSubject.next(value);
      });

      this.getFromState().then((s) => {
        this.stateSubject.next(s);
      });

      return this.stateSubject.pipe(
        tap({
          complete: () => {
            storageUpdateSubscription.unsubscribe();
          },
        })
      );
    }).pipe(
      shareReplay({ refCount: false, bufferSize: 1 }),
      filter<T>((i) => i != FAKE_DEFAULT)
    );
  }

  async update<TCombine>(
    configureState: (state: T, dependency: TCombine) => T,
    options: StateUpdateOptions<T, TCombine> = {}
  ): Promise<T> {
    options = populateOptionsWithDefault(options);
    const currentState = await this.getGuaranteedState();
    const combinedDependencies =
      options.combineLatestWith != null
        ? await firstValueFrom(options.combineLatestWith.pipe(timeout(options.msTimeout)))
        : null;

    if (!options.shouldUpdate(currentState, combinedDependencies)) {
      return;
    }

    const newState = configureState(currentState, combinedDependencies);
    await this.chosenLocation.save(this.storageKey, newState);
    return newState;
  }

  createDerived<TTo>(converter: Converter<T, TTo>): DerivedUserState<TTo> {
    return new DefaultDerivedUserState<T, TTo>(converter, this.encryptService, this);
  }

  private async getGuaranteedState() {
    const currentValue = this.stateSubject.getValue();
    return currentValue === FAKE_DEFAULT ? await this.getFromState() : currentValue;
  }

  async getFromState(): Promise<T> {
    return await getStoredValue(
      this.storageKey,
      this.chosenLocation,
      this.keyDefinition.deserializer
    );
  }
}
