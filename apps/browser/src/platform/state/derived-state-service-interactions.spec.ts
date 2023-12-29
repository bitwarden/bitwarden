/**
 * need to update test environment so structuredClone works appropriately
 * @jest-environment ../../libs/shared/test.environment.ts
 */

import { FakeStorageService } from "@bitwarden/common/../spec/fake-storage.service";
import { awaitAsync, trackEmissions } from "@bitwarden/common/../spec/utils";
import { Subject } from "rxjs";

import { DeriveDefinition } from "@bitwarden/common/platform/state";
// eslint-disable-next-line import/no-restricted-paths -- needed to define a derive definition
import { StateDefinition } from "@bitwarden/common/platform/state/state-definition";
import { Type } from "@bitwarden/common/types/state";

import { mockPorts } from "../../../spec/mock-port.spec-util";

import { BackgroundDerivedState } from "./background-derived-state";
import { ForegroundDerivedState } from "./foreground-derived-state";

const stateDefinition = new StateDefinition("test", "memory");
const deriveDefinition = new DeriveDefinition(stateDefinition, "test", {
  derive: (dateString: string) => (dateString == null ? null : new Date(dateString)),
  deserializer: (dateString: string) => (dateString == null ? null : new Date(dateString)),
});

describe("foreground background derived state interactions", () => {
  let foreground: ForegroundDerivedState<Date>;
  let background: BackgroundDerivedState<string, Date, Record<string, Type<unknown>>>;
  let parentState$: Subject<string>;
  let memoryStorage: FakeStorageService;
  const initialParent = "2020-01-01";

  beforeEach(() => {
    mockPorts();
    parentState$ = new Subject<string>();
    memoryStorage = new FakeStorageService();

    background = new BackgroundDerivedState(parentState$, deriveDefinition, memoryStorage, {});
    foreground = new ForegroundDerivedState(deriveDefinition);
  });

  afterEach(() => {
    parentState$.complete();
    jest.resetAllMocks();
  });

  it("should connect between foreground and background", async () => {
    const foregroundEmissions = trackEmissions(foreground.state$);
    const backgroundEmissions = trackEmissions(background.state$);

    parentState$.next(initialParent);
    await awaitAsync(10);

    expect(foregroundEmissions).toEqual([new Date(initialParent)]);
    expect(backgroundEmissions).toEqual([new Date(initialParent)]);
  });

  it("should initialize a late-connected foreground", async () => {
    const newForeground = new ForegroundDerivedState(deriveDefinition);
    const backgroundEmissions = trackEmissions(background.state$);
    parentState$.next(initialParent);
    await awaitAsync();

    const foregroundEmissions = trackEmissions(newForeground.state$);
    await awaitAsync(10);

    expect(backgroundEmissions).toEqual([new Date(initialParent)]);
    expect(foregroundEmissions).toEqual([new Date(initialParent)]);
  });

  describe("forceValue", () => {
    it("should force the value to the background", async () => {
      const dateString = "2020-12-12";
      const emissions = trackEmissions(background.state$);

      foreground.forceValue(new Date(dateString));
      await awaitAsync();

      expect(emissions).toEqual([new Date(dateString)]);
    });
  });
});
