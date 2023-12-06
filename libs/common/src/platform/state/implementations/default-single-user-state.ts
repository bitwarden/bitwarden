import {
  BehaviorSubject,
  Observable,
  Subscription,
  filter,
  firstValueFrom,
  switchMap,
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
  private updatePromise: Promise<T> | null = null;
  private storageUpdateSubscription: Subscription;
  private subscriberCount = new BehaviorSubject<number>(0);
  private stateObservable: Observable<T>;

  protected stateSubject: BehaviorSubject<T | typeof FAKE_DEFAULT> = new BehaviorSubject<
    T | typeof FAKE_DEFAULT
  >(FAKE_DEFAULT);

  get state$() {
    this.stateObservable = this.stateObservable ?? this.initializeObservable();
    return this.stateObservable;
  }

  constructor(
    readonly userId: UserId,
    private keyDefinition: KeyDefinition<T>,
    private encryptService: EncryptService,
    private chosenLocation: AbstractStorageService & ObservableStorageService,
  ) {
    this.storageKey = userKeyBuilder(this.userId, this.keyDefinition);
  }

  async update<TCombine>(
    configureState: (state: T, dependency: TCombine) => T,
    options: StateUpdateOptions<T, TCombine> = {},
  ): Promise<T> {
    options = populateOptionsWithDefault(options);
    try {
      this.updatePromise = this.getGuaranteedState().then((currentState) =>
        this.internalUpdate(currentState, configureState, options),
      );
      const newState = await this.updatePromise;
      return newState;
    } finally {
      this.updatePromise = null;
    }
  }

  createDerived<TTo>(converter: Converter<T, TTo>): DerivedUserState<TTo> {
    return new DefaultDerivedUserState<T, TTo>(converter, this.encryptService, this);
  }

  private async internalUpdate<TCombine>(
    currentState: T,
    configureState: (state: T, dependency: TCombine) => T,
    options: StateUpdateOptions<T, TCombine>,
  ): Promise<T> {
    const combinedDependencies =
      options.combineLatestWith != null
        ? await firstValueFrom(options.combineLatestWith.pipe(timeout(options.msTimeout)))
        : null;

    if (!options.shouldUpdate(currentState, combinedDependencies)) {
      return currentState;
    }

    const newState = configureState(currentState, combinedDependencies);
    await this.chosenLocation.save(this.storageKey, newState);
    return newState;
  }

  private initializeObservable() {
    const storageUpdates$ = this.chosenLocation.updates$.pipe(
      filter((update) => update.key === this.storageKey),
      switchMap(async (update) => {
        if (update.updateType === "remove") {
          return null;
        }
        return await this.getFromState();
      }),
    );

    this.storageUpdateSubscription = storageUpdates$.subscribe((value) => {
      this.stateSubject.next(value);
    });

    this.subscriberCount.subscribe((count) => {
      if (count === 0 && this.stateObservable != null) {
        this.triggerCleanup();
      }
    });

    // Intentionally un-awaited promise, we don't want to delay return of observable, but we do want to
    // trigger populating it immediately.
    this.getFromState().then((s) => {
      this.stateSubject.next(s);
    });

    return new Observable<T>((subscriber) => {
      this.incrementSubscribers();

      const prevUnsubscribe = subscriber.unsubscribe.bind(subscriber);
      subscriber.unsubscribe = () => {
        this.decrementSubscribers();
        prevUnsubscribe();
      };

      return this.stateSubject
        .pipe(
          // Filter out fake default, which is used to indicate that state is not ready to be emitted yet.
          filter<T>((i) => i != FAKE_DEFAULT),
          // We don't want to emit during an update, so they are filtered
          filter<T>(() => this.updatePromise == null),
        )
        .subscribe(subscriber);
    });
  }

  private async getGuaranteedState() {
    if (this.updatePromise != null) {
      return await this.updatePromise;
    }
    const currentValue = this.stateSubject.getValue();
    return currentValue === FAKE_DEFAULT ? await this.getFromState() : currentValue;
  }

  async getFromState(): Promise<T> {
    if (this.updatePromise != null) {
      return await this.updatePromise;
    }
    return await getStoredValue(
      this.storageKey,
      this.chosenLocation,
      this.keyDefinition.deserializer,
    );
  }

  private incrementSubscribers() {
    this.subscriberCount.next(this.subscriberCount.value + 1);
  }

  private decrementSubscribers() {
    this.subscriberCount.next(this.subscriberCount.value - 1);
  }

  private triggerCleanup() {
    setTimeout(() => {
      if (this.subscriberCount.value === 0) {
        this.updatePromise = null;
        this.storageUpdateSubscription.unsubscribe();
        this.stateObservable = null;
        this.subscriberCount.complete();
        this.subscriberCount = new BehaviorSubject<number>(0);
        this.stateSubject.next(FAKE_DEFAULT);
      }
    }, this.keyDefinition.cleanupDelayMs);
  }
}
