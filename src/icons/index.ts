import { ICON_CATALOG, resolveIconSvg } from "./catalog";
import {
  DEFAULT_MODERN_ICONS,
  DEFAULT_TOOLBAR_ICONS,
} from "./defaults";

export {
  ICON_CATALOG,
  FALLBACK_ICON_ID,
  listCatalogIds,
  resolveIconSvg,
} from "./catalog";

export {
  DEFAULT_MODERN_ICONS,
  DEFAULT_TOOLBAR_ICONS,
  MODERN_ICON_EXAMPLES,
  TOOLBAR_ICON_EXAMPLES,
} from "./defaults";

/**
 * Merge user overrides with defaults and resolve each key to inline SVG markup.
 */
export function resolveIconMap(
  defaults: Record<string, string>,
  overrides: Record<string, string> = {}
): Record<string, string> {
  const result: Record<string, string> = {};
  const keys = new Set([
    ...Object.keys(defaults),
    ...Object.keys(overrides),
  ]);

  for (const key of keys) {
    const iconId = overrides[key] || defaults[key];
    if (iconId) {
      result[key] = resolveIconSvg(iconId);
    }
  }

  return result;
}

export function resolveModernIcons(
  overrides: Record<string, string> = {}
): Record<string, string> {
  return resolveIconMap(DEFAULT_MODERN_ICONS, overrides);
}

export function resolveToolbarIcons(
  overrides: Record<string, string> = {}
): Record<string, string> {
  return resolveIconMap(DEFAULT_TOOLBAR_ICONS, overrides);
}

/** Serialize catalog for injection into the webview script. */
export function serializeIconCatalog(): string {
  return JSON.stringify(ICON_CATALOG);
}

export function serializeDefaults(): string {
  return JSON.stringify({
    modern: DEFAULT_MODERN_ICONS,
    toolbar: DEFAULT_TOOLBAR_ICONS,
  });
}
