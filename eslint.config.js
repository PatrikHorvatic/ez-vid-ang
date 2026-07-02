// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.all,
      tseslint.configs.all,
      angular.configs.tsAll,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // -----------------------------------------------
      // Angular selectors
      // -----------------------------------------------
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "eva", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "eva", style: "kebab-case" },
      ],
      "@angular-eslint/pipe-prefix": [
        "error",
        { prefixes: ["eva"] },
      ],
      // -----------------------------------------------
      // Base ESLint rules turned off in favor of their
      // @typescript-eslint equivalents
      // -----------------------------------------------
      "class-methods-use-this": "off",
      "consistent-return": "off",
      "default-param-last": "off",
      "dot-notation": "off",
      "init-declarations": "off",
      "max-params": "off",
      "no-array-constructor": "off",
      "no-negated-condition": "off",
      "no-dupe-class-members": "off",
      "no-empty-function": "off",
      "no-implied-eval": "off",
      "no-invalid-this": "off",
      "no-loop-func": "off",
      "no-magic-numbers": "off",
      "no-redeclare": "off",
      "no-restricted-imports": "off",
      "no-return-await": "off",
      "no-shadow": "off",
      "no-throw-literal": "off",
      "no-unused-expressions": "off",
      "no-unused-private-class-members": "off",
      "no-unused-vars": "off",
      "no-use-before-define": "off",
      "no-useless-constructor": "off",
      "prefer-destructuring": "off",
      "prefer-promise-reject-errors": "off",
      "require-await": "off",

      // -----------------------------------------------
      // Rules incompatible with TypeScript / Angular
      // -----------------------------------------------
      "no-undefined": "off",
      strict: "off",
      "new-cap": "off",

      // -----------------------------------------------
      // Rules that conflict with other enabled rules
      // -----------------------------------------------
      "sort-keys": "off",
      "sort-imports": "off",
      "sort-vars": "off",
      "no-ternary": "off",

      // -----------------------------------------------
      // @typescript-eslint rule configuration
      // -----------------------------------------------
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/consistent-type-exports": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
          ignore: [-1, 0, 1],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": ["off"],
      "@typescript-eslint/max-params": ["error", { max: 4 }],
      "@typescript-eslint/method-signature-style": ["error", "property"],
      "@typescript-eslint/prefer-readonly-parameter-types": "off",
      "@typescript-eslint/member-ordering": "off",
      "@angular-eslint/component-class-suffix": "off",
      "@angular-eslint/directive-class-suffix": "off",
      "@angular-eslint/use-injectable-provided-in": "off",
      "@typescript-eslint/consistent-type-definitions": ["off"],
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/class-methods-use-this": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/prefer-destructuring": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "@typescript-eslint/return-await": ["error", "always"],

      // -----------------------------------------------
      // Core ESLint rule configuration
      // -----------------------------------------------
      "no-param-reassign": "off",
      "no-inline-comments": "off",
      "no-console": ["error", { allow: ["warn"] }],

      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "one-var": ["error", "never"],
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      complexity: ["error", { max: 40 }],
      "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
      "max-depth": ["error", { max: 4 }],
      "max-nested-callbacks": ["error", { max: 3 }],
      "max-lines": ["error", { max: 2000, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "error",
        { max: 75, skipBlankLines: true, skipComments: true },
      ],
      "max-classes-per-file": ["error", { max: 1 }],
      "id-length": ["error", { min: 1, exceptions: ["_"] }],
      "max-statements": ["error", { max: 100 }],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateAll,
      angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/cyclomatic-complexity": ["error", { maxComplexity: 10 }],
      "@angular-eslint/template/no-call-expression": "off",
      "@angular-eslint/template/no-inline-styles": "off",
      "@angular-eslint/template/no-interpolation-in-attributes": "off",
      "@angular-eslint/template/i18n": "off",
    },
  },
]);
