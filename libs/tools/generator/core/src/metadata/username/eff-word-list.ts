import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { GENERATOR_DISK } from "@bitwarden/common/platform/state";
import { PublicClassifier } from "@bitwarden/common/tools/public-classifier";
import { IdentityConstraint } from "@bitwarden/common/tools/state/identity-state-constraint";

import { UsernameRandomizer } from "../../engine";
import {
  CredentialGenerator,
  EffUsernameGenerationOptions,
  GeneratorDependencyProvider,
  NoPolicy,
} from "../../types";
import { deepFreeze } from "../../util";
import { Algorithm, Purpose, Type } from "../data";
import { GeneratorMetadata } from "../generator-metadata";

const effWordList: GeneratorMetadata<EffUsernameGenerationOptions, NoPolicy> = deepFreeze({
  id: Algorithm.username,
  category: Type.username,
  i18nKeys: {
    name: "randomWord",
    generateCredential: "generateUsername",
    credentialGenerated: "username",
    copyCredential: "copyUsername",
  },
  capabilities: {
    autogenerate: true,
    fields: [],
  },
  engine: {
    create(
      dependencies: GeneratorDependencyProvider,
    ): CredentialGenerator<EffUsernameGenerationOptions> {
      return new UsernameRandomizer(dependencies.randomizer);
    },
  },
  options: {
    constraints: {},
    [Purpose.account]: {
      storage: {
        key: "effUsernameGeneratorSettings",
        target: "object",
        format: "plain",
        classifier: new PublicClassifier<EffUsernameGenerationOptions>([
          "wordCapitalize",
          "wordIncludeNumber",
        ]),
        state: GENERATOR_DISK,
        initial: {
          wordCapitalize: false,
          wordIncludeNumber: false,
          website: null,
        },
        options: {
          deserializer: (value) => value,
          clearOn: ["logout"],
        },
      },
      policy: {
        type: PolicyType.PasswordGenerator,
        disabledValue: {},
      },
    },
  },
  policy: {
    combine(_acc: NoPolicy, _policy: Policy) {
      return {};
    },
    toConstraints(_policy: NoPolicy) {
      return new IdentityConstraint<EffUsernameGenerationOptions>();
    },
  },
});

export default effWordList;
