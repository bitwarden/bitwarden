import { MockProxy } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import { LOCALE_KEY, PreferredLanguageMigrator } from "./26-move-preferred-language";

function exampleJSON() {
  return {
    global: {
      locale: "en",
      otherStuff: "otherStuff1",
    },
    otherStuff: "otherStuff2",
  };
}

function rollbackJSON() {
  return {
    global_translation_locale: "en",
    global: {
      otherStuff: "otherStuff1",
    },
    otherStuff: "otherStuff2",
  };
}

describe("ProviderKeysMigrator", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: PreferredLanguageMigrator;

  describe("migrate", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(exampleJSON(), 24);
      sut = new PreferredLanguageMigrator(25, 26);
    });

    it("should remove locale setting from global", async () => {
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledTimes(1);
      expect(helper.set).toHaveBeenCalledWith("global", {
        otherStuff: "otherStuff1",
      });
    });

    it("should set locale for global state provider", async () => {
      await sut.migrate(helper);

      expect(helper.setToGlobal).toHaveBeenCalledTimes(1);
      expect(helper.setToGlobal).toHaveBeenCalledWith(LOCALE_KEY, "en");
    });
  });

  describe("rollback", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(rollbackJSON(), 23);
      sut = new PreferredLanguageMigrator(25, 26);
    });

    it("should null out new values for global", async () => {
      await sut.rollback(helper);

      expect(helper.setToGlobal).toHaveBeenCalledTimes(1);
      expect(helper.setToGlobal).toHaveBeenCalledWith(LOCALE_KEY, null);
    });

    it("should add locale back to the old global object", async () => {
      await sut.rollback(helper);

      expect(helper.set).toHaveBeenCalledTimes(1);
      expect(helper.set).toHaveBeenCalledWith("global", {
        locale: "en",
        otherStuff: "otherStuff1",
      });
    });
  });
});
