// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
// @ts-ignore
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginTailwindCSS from "eslint-plugin-tailwindcss";
import rxjs from "eslint-plugin-rxjs";
import angularRxjs from "eslint-plugin-rxjs-angular";
import storybook from "eslint-plugin-storybook";

export default tseslint.config(
  ...storybook.configs["flat/recommended"],
  {
    // Everything in this config object targets our TypeScript files (Components, Directives, Pipes etc)
    files: ["**/*.ts", "**/*.js"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      //...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      eslintConfigPrettier, // Disables rules that conflict with Prettier
    ],
    plugins: {
      rxjs: rxjs,
      "rxjs-angular": angularRxjs,
    },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        sourceType: "module",
        ecmaVersion: 2020,
      },
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      ...rxjs.configs.recommended.rules,
      "rxjs-angular/prefer-takeuntil": ["error", { alias: ["takeUntilDestroyed"] }],
      "rxjs/no-exposed-subjects": ["error", { allowProtected: true }],

      // TODO: Enable these.
      "@angular-eslint/component-class-suffix": 0,
      "@angular-eslint/contextual-lifecycle": 0,
      "@angular-eslint/directive-class-suffix": 0,
      "@angular-eslint/no-empty-lifecycle-method": 0,
      "@angular-eslint/no-host-metadata-property": 0,
      "@angular-eslint/no-input-rename": 0,
      "@angular-eslint/no-inputs-metadata-property": 0,
      "@angular-eslint/no-output-native": 0,
      "@angular-eslint/no-output-on-prefix": 0,
      "@angular-eslint/no-output-rename": 0,
      "@angular-eslint/no-outputs-metadata-property": 0,
      "@angular-eslint/use-lifecycle-interface": "error",
      "@angular-eslint/use-pipe-transform-interface": 0,

      "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],
      "@typescript-eslint/no-explicit-any": "off", // TODO: This should be re-enabled
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
      "@typescript-eslint/no-this-alias": ["error", { allowedNames: ["self"] }],
      "@typescript-eslint/no-unused-expressions": ["error", { allowTernary: true }],
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],

      curly: ["error", "all"],
      "no-console": "error",

      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
          },
          "newlines-between": "always",
          pathGroups: [
            {
              pattern: "@bitwarden/**",
              group: "external",
              position: "after",
            },
            {
              pattern: "src/**/*",
              group: "parent",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
      "import/namespace": ["off"], // This doesn't resolve namespace imports correctly, but TS will throw for this anyway
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: ["libs/**/*"],
              from: ["apps/**/*"],
              message: "Libs should not import app-specific code.",
            },
            {
              // avoid specific frameworks or large dependencies in common
              target: "./libs/common/**/*",
              from: [
                // Angular
                "./libs/angular/**/*",
                "./node_modules/@angular*/**/*",

                // Node
                "./libs/node/**/*",

                //Generator
                "./libs/tools/generator/components/**/*",
                "./libs/tools/generator/core/**/*",
                "./libs/tools/generator/extensions/**/*",

                // Import/export
                "./libs/importer/**/*",
                "./libs/tools/export/vault-export/vault-export-core/**/*",
              ],
            },
            {
              // avoid import of unexported state objects
              target: [
                "!(libs)/**/*",
                "libs/!(common)/**/*",
                "libs/common/!(src)/**/*",
                "libs/common/src/!(platform)/**/*",
                "libs/common/src/platform/!(state)/**/*",
              ],
              from: ["./libs/common/src/platform/state/**/*"],
              // allow module index import
              except: ["**/state/index.ts"],
            },
          ],
        },
      ],
      "import/no-unresolved": "off", // TODO: Look into turning off once each package is an actual package.,
    },
  },
  {
    // Everything in this config object targets our HTML files (external templates,
    // and inline templates as long as we have the `processor` set on our TypeScript config above)
    files: ["**/*.html"],
    extends: [
      // Apply the recommended Angular template rules
      // ...angular.configs.templateRecommended,
      // Apply the Angular template rules which focus on accessibility of our apps
      // ...angular.configs.templateAccessibility,
    ],
    languageOptions: {
      parser: angular.templateParser,
    },
    plugins: {
      "@angular-eslint/template": angular.templatePlugin,
      tailwindcss: eslintPluginTailwindCSS,
    },
    rules: {
      "@angular-eslint/template/button-has-type": "error",
      "tailwindcss/no-custom-classname": [
        "error",
        {
          // uses negative lookahead to whitelist any class that doesn't start with "tw-"
          // in other words: classnames that start with tw- must be valid TailwindCSS classes
          whitelist: ["(?!(tw)\\-).*"],
        },
      ],
      "tailwindcss/enforces-negative-arbitrary-values": "error",
      "tailwindcss/enforces-shorthand": "error",
      "tailwindcss/no-contradicting-classname": "error",
    },
  },

  // Global quirks
  {
    files: ["apps/browser/src/**/*.ts", "libs/**/*.ts"],
    ignores: [
      "apps/browser/src/autofill/{deprecated/content,content,notification}/**/*.ts",
      "apps/browser/src/**/background/**/*.ts", // It's okay to have long lived listeners in the background
      "apps/browser/src/platform/background.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          message:
            "Using addListener in the browser popup produces a memory leak in Safari, use `BrowserApi.addListener` instead",
          // This selector covers events like chrome.storage.onChange & chrome.runtime.onMessage
          selector:
            "CallExpression > [object.object.object.name='chrome'][property.name='addListener']",
        },
        {
          message:
            "Using addListener in the browser popup produces a memory leak in Safari, use `BrowserApi.addListener` instead",
          // This selector covers events like chrome.storage.local.onChange
          selector:
            "CallExpression > [object.object.object.object.name='chrome'][property.name='addListener']",
        },
      ],
    },
  },
  {
    files: ["**/src/**/*.ts"],
    ignores: ["**/platform/**/*.ts"],
    rules: {
      "no-restricted-imports": buildNoRestrictedImports(),
    },
  },

  // App overrides. Be considerate if you override these.
  {
    files: ["apps/browser/src/**/*.ts"],
    ignores: [
      "apps/browser/src/**/{content,popup,spec}/**/*.ts",
      "apps/browser/src/**/autofill/{notification,overlay}/**/*.ts",
      "apps/browser/src/**/autofill/**/{autofill-overlay-content,collect-autofill-content,dom-element-visibility,insert-autofill-content}.service.ts",
      "apps/browser/src/**/*.spec.ts",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message:
            "The `window` object is not available in service workers and may not be available within the background script. Consider using `self`, `globalThis`, or another global property instead.",
        },
      ],
    },
  },
  {
    files: ["apps/web/src/**/*.ts"],
    rules: {
      "no-restricted-imports": buildNoRestrictedImports([
        "**/app/core/*",
        "**/reports/*",
        "**/app/shared/*",
        "**/organizations/settings/*",
        "**/organizations/policies/*",
      ]),
    },
  },
  {
    files: ["bitwarden_license/bit-common/src/**/*.ts"],
    rules: {
      "no-restricted-imports": buildNoRestrictedImports(["@bitwarden/bit-common/*"]),
    },
  },
  {
    files: ["apps/**/*.ts"],
    rules: {
      // Catches static imports
      "no-restricted-imports": buildNoRestrictedImports([
        "bitwarden_license/**",
        "@bitwarden/bit-common/*",
        "@bitwarden/bit-web/*",
      ]),
    },
  },

  /// Team overrides
  {
    files: ["**/src/platform/**/*.ts"],
    rules: {
      "no-restricted-imports": buildNoRestrictedImports([], true),
    },
  },
  {
    files: [
      "apps/cli/src/admin-console/**/*.ts",
      "apps/web/src/app/admin-console/**/*.ts",
      "bitwarden_license/bit-cli/src/admin-console/**/*.ts",
      "bitwarden_license/bit-web/src/app/admin-console/**/*.ts",
      "libs/admin-console/src/**/*.ts",
    ],
    rules: {
      "@angular-eslint/component-class-suffix": "error",
      "@angular-eslint/contextual-lifecycle": "error",
      "@angular-eslint/directive-class-suffix": "error",
      "@angular-eslint/no-empty-lifecycle-method": "error",
      "@angular-eslint/no-input-rename": "error",
      "@angular-eslint/no-inputs-metadata-property": "error",
      "@angular-eslint/no-output-native": "error",
      "@angular-eslint/no-output-on-prefix": "error",
      "@angular-eslint/no-output-rename": "error",
      "@angular-eslint/no-outputs-metadata-property": "error",
      "@angular-eslint/use-lifecycle-interface": "error",
      "@angular-eslint/use-pipe-transform-interface": "error",
    },
  },
  {
    files: ["libs/common/src/state-migrations/**/*.ts"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          basePath: "libs/common/src/state-migrations",
          zones: [
            {
              target: "./",
              from: "../",
              // Relative to from, not basePath
              except: ["state-migrations"],
              message:
                "State migrations should rarely import from the greater codebase. If you need to import from another location, take into account the likelihood of change in that code and consider copying to the migration instead.",
            },
          ],
        },
      ],
    },
  },

  // Keep ignores at the end
  {
    ignores: [
      "**/build/",
      "**/dist/",
      "**/coverage/",
      ".angular/",
      "storybook-static/",

      "**/node_modules/",

      "**/webpack.*.js",
      "**/jest.config.js",

      "apps/browser/config/config.js",
      "apps/browser/src/auth/scripts/duo.js",
      "apps/browser/webpack/manifest.js",

      "apps/desktop/desktop_native",
      "apps/desktop/src/auth/scripts/duo.js",

      "apps/web/config.js",
      "apps/web/scripts/*.js",
      "apps/web/tailwind.config.js",

      "apps/cli/config/config.js",

      "tailwind.config.js",
      "libs/components/tailwind.config.base.js",
      "libs/components/tailwind.config.js",

      "scripts/*.js",
    ],
  },
);

/**
 * // Helper function for building no-restricted-imports rule
 * @param {string[]} additionalForbiddenPatterns
 * @returns {any}
 */
function buildNoRestrictedImports(additionalForbiddenPatterns = [], skipPlatform = false) {
  return [
    "error",
    {
      patterns: [
        ...(skipPlatform ? [] : ["**/platform/**/internal", "**/platform/messaging/**"]),
        "**/src/**/*", // Prevent relative imports across libs.
      ].concat(additionalForbiddenPatterns),
    },
  ];
}
