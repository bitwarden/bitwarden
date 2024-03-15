import { KeyDefinitionLike, MigrationHelper, StateDefinitionLike } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedGlobalState = { rememberedEmail?: string };

const REMEMBER_EMAIL_STATE: StateDefinitionLike = { name: "rememberEmail" };

const STORED_EMAIL: KeyDefinitionLike = {
  key: "storedEmail",
  stateDefinition: REMEMBER_EMAIL_STATE,
};

export class RememberedEmailMigrator extends Migrator<37, 38> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const legacyGlobal = await helper.get<ExpectedGlobalState>("global");

    // Move global data
    if (legacyGlobal?.rememberedEmail != null) {
      await helper.setToGlobal(STORED_EMAIL, legacyGlobal.rememberedEmail);
    }

    // Delete legacy global data
    delete legacyGlobal?.rememberedEmail;
    await helper.set("global", legacyGlobal);
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    let legacyGlobal = await helper.get<ExpectedGlobalState>("global");
    let updatedLegacyGlobal = false;
    const globalStoredEmail = await helper.getFromGlobal<string>(STORED_EMAIL);

    if (globalStoredEmail) {
      if (!legacyGlobal) {
        legacyGlobal = {};
      }

      updatedLegacyGlobal = true;
      legacyGlobal.rememberedEmail = globalStoredEmail;
      await helper.setToGlobal(STORED_EMAIL, null);
    }

    if (updatedLegacyGlobal) {
      await helper.set("global", legacyGlobal);
    }
  }
}
