const registry = new Map<string, string>();

/**
 * Converts an exported icon constant name to its registry key.
 *
 * `evaForward10Icon` → `forward-10`
 * `evaCinemaModeIcon` → `cinema-mode`
 */
function toRegistryKey(exportName: string): string {
  return exportName
    .replace(/^eva/u, '')
    .replace(/Icon$/u, '')
    .replace(/(?<lower>[a-z])(?<upper>[A-Z])/gu, '$<lower>-$<upper>')
    .replace(/(?<letter>[a-zA-Z])(?<digit>\d)/gu, '$<letter>-$<digit>')
    .replace(/(?<digit>\d)(?<letter>[a-zA-Z])/gu, '$<digit>-$<letter>')
    .toLowerCase();
}

/**
 * Registers one or more SVG icon strings into the global Eva icon registry.
 *
 * Keys are derived automatically from the export name:
 * - Strip the `eva` prefix and `Icon` suffix
 * - Convert camelCase + digits to kebab-case
 *
 * @example
 * // Register specific icons
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaPlayIcon, evaPauseIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaPlayIcon, evaPauseIcon });
 *
 * @example
 * // Register all default icons at once
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaAllIcons } from 'ez-vid-ang/icons';
 * addEvaIcons(evaAllIcons);
 */
export function addEvaIcons(icons: Record<string, string>): void {
  for (const [key, svg] of Object.entries(icons)) {
    registry.set(toRegistryKey(key), svg);
  }
}

/**
 * Retrieves a registered SVG string by its kebab-case registry key.
 * Returns `undefined` if the icon has not been registered.
 *
 * @internal Used by `EvaIcon` to resolve the SVG at render time.
 */
export function getEvaIcon(name: string): string | undefined {
  return registry.get(name);
}
