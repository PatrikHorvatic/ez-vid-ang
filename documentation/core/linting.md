# Linting

EzVidAng uses a strict ESLint configuration with type-aware rules for both TypeScript and Angular templates.

## Setup

The linter is configured via two flat config files:

- **`eslint.config.js`** (root) — defines all rules, presets, and overrides.
- **`projects/ez-vid-ang/eslint.config.js`** — extends the root config and adds project-specific selector overrides.

### Packages

| Package | Purpose |
|---------|---------|
| `eslint` | Core linter (v10) |
| `typescript-eslint` | TypeScript parser and 127 type-checked rules |
| `angular-eslint` | Angular-specific rules for TypeScript and templates |
| `@eslint/js` | ESLint core rule presets |

## Running

```bash
npm run lint        # Check for errors
npx ng lint --fix   # Auto-fix what can be fixed
```

## Presets

The configuration starts from the strictest available presets:

| Preset | Source | Scope |
|--------|--------|-------|
| `eslint.configs.all` | ESLint core | All core JavaScript rules |
| `tseslint.configs.all` | typescript-eslint | All 127 TypeScript rules (type-checked) |
| `angular.configs.tsAll` | angular-eslint | All Angular TypeScript rules |
| `angular.configs.templateAll` | angular-eslint | All Angular template rules |
| `angular.configs.templateAccessibility` | angular-eslint | All accessibility rules |

## Selectors

Components and directives must use the `eva` prefix:

- **Components:** `eva-` prefix, kebab-case (e.g. `eva-scrub-bar`)
- **Directives:** `eva` prefix, camelCase (e.g. `evaKeyboardShortcuts`)
- **Pipes:** `eva` prefix (e.g. `evaTimeDisplay`)

## Key Rules

### Enforced

| Rule | Setting | Effect |
|------|---------|--------|
| `explicit-function-return-type` | error | All functions must have explicit return types |
| `explicit-member-accessibility` | no-public | Class members must not have redundant `public` keyword |
| `no-magic-numbers` | error | Numbers must be named constants (see [constants.md](constants.md)) |
| `curly` | all | All control flow must use braces |
| `eqeqeq` | always | Strict equality only |
| `no-console` | error (warn allowed) | Only `console.warn` is permitted |
| `max-lines-per-function` | 75 | Functions should stay under 75 lines |
| `complexity` | 40 | Maximum cyclomatic complexity |
| `no-plusplus` | error (loop afterthoughts allowed) | Use `i += 1` except in `for` loop updates |

### Disabled

Rules disabled because they are incompatible with TypeScript, Angular, or the project's conventions:

| Rule | Reason |
|------|--------|
| `no-explicit-any` | Needed for browser API polyfills and Angular DI edge cases |
| `consistent-type-imports` | Type-only imports add no value in an Angular library (tree-shaking handles it) |
| `strict-boolean-expressions` | Too many false positives with Angular's nullable patterns |
| `no-unnecessary-condition` | False positives with `SimpleChanges`, required inputs, and runtime-nullable values |
| `no-unsafe-type-assertion` | Legitimate narrowing casts needed for DOM APIs and Angular event types |
| `naming-convention` | Project uses mixed conventions across Angular host bindings, ARIA attributes, and enums |
| `prefer-readonly-parameter-types` | Incompatible with Angular's mutable service and signal patterns |
| `member-ordering` | Not enforced — components group by feature, not by member kind |
| `template/i18n` | Project does not use Angular i18n |
| `template/no-call-expression` | Signal reads (`mySignal()`) are function calls in templates |
| `template/no-inline-styles` | Dynamic inline styles are used for positioning (scrub bar, tooltips) |
| `use-injectable-provided-in` | Services are intentionally scoped per-component, not `providedIn: 'root'` |

## Template Rules

Template-specific rule overrides go in the `files: ["**/*.html"]` block, not the `files: ["**/*.ts"]` block. This is because the `processInlineTemplates` processor extracts inline templates into virtual `.html` files that are matched by the HTML config block.

## Project-Level Overrides

`projects/ez-vid-ang/eslint.config.js` extends the root config and can add project-specific overrides. Template rule overrides must also be placed in the `files: ["**/*.html"]` block here.
