// @ts-check
const { defineConfig } = require("eslint/config");
const rootConfig = require("../../eslint.config.js");

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ["**/*.ts"],
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "eva",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "eva",
          style: "kebab-case",
        },
      ],

    },
  },
  {
    files: ["**/*.html"],
    rules: {
      "@angular-eslint/template/no-call-expression": "off",
      "@angular-eslint/template/no-inline-styles": "off",
    },
  },
]);
