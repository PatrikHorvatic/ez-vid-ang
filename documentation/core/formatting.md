# Formatting

EzVidAng uses [Prettier](https://prettier.io) to keep code style consistent across TypeScript, HTML templates, SCSS, and JSON files.

## Setup

- **`.prettierrc.cjs`** (root) — defines all formatting options, documented inline.
- **`.prettierignore`** (root) — excludes `dist`, `node_modules`, `android`, `.angular`, `coverage`, `package-lock.json`, and `lint-results.json`.
- **`eslint-config-prettier`** is applied last in `eslint.config.js` to turn off every ESLint stylistic rule that would otherwise conflict with Prettier's output (`eslint.configs.all` and `tseslint.configs.all` enable formatting rules like `quotes`, `indent`, and `comma-dangle` that Prettier already owns).

## Running

```bash
npm run format        # Format all files in projects/
npm run format:check  # Check formatting without writing changes (CI-friendly)
```

## Key Options

| Option | Setting | Effect |
|--------|---------|--------|
| `printWidth` | 250 | Long lines are tolerated before wrapping — favors fewer, denser lines over aggressive wrapping |
| `singleQuote` | false | Double quotes in TS/JS |
| `semi` | true | Trailing semicolons |
| `trailingComma` | all | Trailing commas wherever valid, including function args |
| `arrowParens` | always | `(x) => x`, not `x => x` |
| `tabWidth` | 2 | Two-space indentation |
| `endOfLine` | lf | Unix line endings, regardless of OS |

### `.html` override

Angular template files (`*.html`) use the `angular` parser, which correctly indents `@if` / `@for` / `@switch` control-flow blocks instead of leaving them unindented like the default HTML parser would.

## Editor Setup

The repo's `.vscode/settings.json` sets Prettier as the default formatter for `.ts`, `.html`, `.scss`, and `.json`, with `editor.formatOnSave` enabled. Install the recommended `esbenp.prettier-vscode` extension (see `.vscode/extensions.json`) to pick this up automatically — no per-user configuration needed.

## Relationship to Linting

Prettier owns formatting (whitespace, quotes, line breaks); ESLint owns code quality and correctness (see [linting documentation](linting.md)). `eslint-config-prettier` keeps the two from fighting over the same rules — if a stylistic ESLint error and a Prettier auto-format ever disagree, that's a sign `eslint-config-prettier` needs an update, not a sign to hand-format around it.
