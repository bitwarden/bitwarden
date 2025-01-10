// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
// @ts-ignore
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    // Everything in this config object targets our TypeScript files (Components, Directives, Pipes etc)
    files: ["*.ts", "*.js"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      //...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      eslintConfigPrettier, // Disables rules that conflict with Prettier
    ],
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
    files: ["*.html"],
    extends: [
      // Apply the recommended Angular template rules
      ...angular.configs.templateRecommended,
      // Apply the Angular template rules which focus on accessibility of our apps
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
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
