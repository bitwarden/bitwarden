import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { OnInit, Input, Output, EventEmitter, Component, OnDestroy } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import {
  BehaviorSubject,
  skip,
  takeUntil,
  Subject,
  filter,
  map,
  withLatestFrom,
  Observable,
  merge,
  firstValueFrom,
  ReplaySubject,
  tap,
} from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { UserId } from "@bitwarden/common/types/guid";
import {
  Generators,
  CredentialGeneratorService,
  PassphraseGenerationOptions,
} from "@bitwarden/generator-core";

import { completeOnAccountSwitch, toValidators } from "./util";

const Controls = Object.freeze({
  numWords: "numWords",
  includeNumber: "includeNumber",
  capitalize: "capitalize",
  wordSeparator: "wordSeparator",
});

/** Options group for passphrases */
@Component({
  selector: "tools-passphrase-settings",
  templateUrl: "passphrase-settings.component.html",
})
export class PassphraseSettingsComponent implements OnInit, OnDestroy {
  /** Instantiates the component
   *  @param accountService queries user availability
   *  @param generatorService settings and policy logic
   *  @param i18nService localize hints
   *  @param formBuilder reactive form controls
   */
  constructor(
    private formBuilder: FormBuilder,
    private generatorService: CredentialGeneratorService,
    private i18nService: I18nService,
    private accountService: AccountService,
  ) {}

  /** Binds the component to a specific user's settings.
   *  When this input is not provided, the form binds to the active
   *  user
   */
  @Input()
  userId: UserId | null;

  /** When `true`, an options header is displayed by the component. Otherwise, the header is hidden. */
  @Input()
  showHeader: boolean = true;

  /** Removes bottom margin from `bit-section` */
  @Input({ transform: coerceBooleanProperty }) disableMargin = false;

  /** Emits settings updates and completes if the settings become unavailable.
   * @remarks this does not emit the initial settings. If you would like
   *   to receive live settings updates including the initial update,
   *   use `CredentialGeneratorService.settings$(...)` instead.
   */
  @Output()
  readonly onUpdated = new EventEmitter<PassphraseGenerationOptions>();

  protected settings = this.formBuilder.group({
    [Controls.numWords]: [Generators.passphrase.settings.initial.numWords],
    [Controls.wordSeparator]: [Generators.passphrase.settings.initial.wordSeparator],
    [Controls.capitalize]: [Generators.passphrase.settings.initial.capitalize],
    [Controls.includeNumber]: [Generators.passphrase.settings.initial.includeNumber],
  });

  async ngOnInit() {
    const singleUserId$ = this.singleUserId$();
    const settings = await this.generatorService.settings(Generators.passphrase, { singleUserId$ });
    settings
      .pipe(
        filter((s) => !!s),
        tap((value) => console.log(`update ok settings: ${JSON.stringify(value)}`)),
        takeUntil(this.destroyed$),
      )
      .subscribe(this.okSettings$);

    // skips reactive event emissions to break a subscription cycle
    settings.pipe(takeUntil(this.destroyed$)).subscribe((s) => {
      this.settings.patchValue(s, { emitEvent: false });
    });

    // the first emission is the current value; subsequent emissions are updates
    settings.pipe(skip(1), takeUntil(this.destroyed$)).subscribe(this.onUpdated);

    // dynamic policy enforcement
    this.generatorService
      .policy$(Generators.passphrase, { userId$: singleUserId$ })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ constraints }) => {
        this.settings
          .get(Controls.numWords)
          .setValidators(toValidators(Controls.numWords, Generators.passphrase, constraints));

        this.settings
          .get(Controls.wordSeparator)
          .setValidators(toValidators(Controls.wordSeparator, Generators.passphrase, constraints));

        this.settings.updateValueAndValidity({ emitEvent: false });

        this.policyInEffect = constraints.policyInEffect;

        this.toggleEnabled(Controls.capitalize, !constraints.capitalize?.readonly);
        this.toggleEnabled(Controls.includeNumber, !constraints.includeNumber?.readonly);

        const boundariesHint = this.i18nService.t(
          "generatorBoundariesHint",
          constraints.numWords.min,
          constraints.numWords.max,
        );
        this.numWordsBoundariesHint.next(boundariesHint);
      });

    // now that outputs are set up, connect inputs
    this.settings$().pipe(takeUntil(this.destroyed$)).subscribe(settings);
  }

  protected settings$(): Observable<Partial<PassphraseGenerationOptions>> {
    // save valid changes
    const validChanges$ = this.settings.statusChanges.pipe(
      filter((status) => status === "VALID"),
      withLatestFrom(this.settings.valueChanges),
      map(([, settings]) => settings),
      tap((value) => console.log(`valid change: ${JSON.stringify(value)}`))
    );

    // discards changes but keep the override setting that changed
    const overrides = [Controls.capitalize, Controls.includeNumber];
    const overrideChanges$ = this.settings.valueChanges.pipe(
      filter((settings) => !!settings),
      withLatestFrom(this.okSettings$),
      filter(([current, ok]) => overrides.some((c) => (current[c] ?? ok[c]) !== ok[c])),
      map(([current, ok]) => {
        const copy = { ...ok };
        for (const override of overrides) {
          copy[override] = current[override];
        }
        return copy;
      }),
      tap((value) => console.log(`override: ${JSON.stringify(value)}`))
    );

    // save reloaded settings when requested
    const reloadChanges$ = this.reloadSettings$.pipe(
      withLatestFrom(this.okSettings$),
      map(([, settings]) => settings),
      tap((value) => console.log(`reload: ${JSON.stringify(value)}`))
    );

    return merge(validChanges$, overrideChanges$, reloadChanges$);
  }

  /** display binding for enterprise policy notice */
  protected policyInEffect: boolean;

  private okSettings$ = new ReplaySubject<PassphraseGenerationOptions>(1);

  private reloadSettings$ = new Subject<string>();

  /** triggers a reload of the users' settings
   *  @param site labels the invocation site so that an operation
   *   can be traced back to its origin. Useful for debugging rxjs.
   *  @returns a promise that completes once a reload occurs.
   */
  async reloadSettings(site: string = "component api call") {
    const reloadComplete = firstValueFrom(this.okSettings$);
    if (this.settings.invalid) {
      this.reloadSettings$.next(site);
      await reloadComplete;
    }
  }

  private numWordsBoundariesHint = new ReplaySubject<string>(1);

  /** display binding for min/max constraints of `numWords` */
  protected numWordsBoundariesHint$ = this.numWordsBoundariesHint.asObservable();

  private toggleEnabled(setting: keyof typeof Controls, enabled: boolean) {
    if (enabled) {
      this.settings.get(setting).enable({ emitEvent: false });
    } else {
      this.settings.get(setting).disable({ emitEvent: false });
    }
  }

  private singleUserId$() {
    // FIXME: this branch should probably scan for the user and make sure
    // the account is unlocked
    if (this.userId) {
      return new BehaviorSubject(this.userId as UserId).asObservable();
    }

    return this.accountService.activeAccount$.pipe(
      completeOnAccountSwitch(),
      takeUntil(this.destroyed$),
    );
  }

  private readonly destroyed$ = new Subject<void>();
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
