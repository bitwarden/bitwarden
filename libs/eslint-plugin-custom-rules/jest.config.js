const { pathsToModuleNameMapper } = require("ts-jest");

const { compilerOptions } = require("../shared/tsconfig.spec");

const sharedConfig = require("../../libs/shared/jest.config.angular");

/** @type {import('jest').Config} */
module.exports = {
  ...sharedConfig,
  testMatch: ["**/+(*.)+(spec).+(js)"],
  displayName: "libs/eslint-plugin-custom-rules tests",
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/test.setup.js"],
  // moduleNameMapper: pathsToModuleNameMapper(compilerOptions?.paths || {}, {
  //   prefix: "<rootDir>/",
  // }),
};
