// Theme resolution for the @xeplr UI packages.
//
// The model is two layers:
//   1. default.theme.json — the brand-neutral BASE. Holds the design for every
//      themed component (chart, table, …). Upstream; nobody edits it.
//   2. an override object the CONSUMER supplies. deepMerge lays it over the base;
//      overrides WIN, and anything not overridden falls through to the default.
//
//   resolved = resolveTheme(appOverrides)          // whole theme, both variants
//   variant  = getThemeVariant('dark', overrides)  // one variant's { colorset, chart, table }
//
// Then @xeplr/ui-charts reads variant.chart, @xeplr/ui-table reads variant.table,
// both over the shared variant.colorset foundation.

import defaultTheme from './default.theme.json' with { type: 'json' };

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep-merge `override` onto `base` (immutably). Objects merge key-by-key;
 * everything else (including ARRAYS — e.g. a palette) is REPLACED, not merged,
 * so an override palette wholly supersedes the default instead of blending
 * index-by-index. `undefined` in the override never clobbers a base value.
 */
export function deepMerge(base, override) {
  if (override === undefined) return base;
  if (!isPlainObject(override) || !isPlainObject(base)) return override;
  const out = { ...base };
  for (const key of Object.keys(override)) {
    const o = override[key];
    if (o === undefined) continue;
    out[key] = isPlainObject(o) && isPlainObject(base[key]) ? deepMerge(base[key], o) : o;
  }
  return out;
}

/** Resolve the full theme: default base with consumer overrides merged on top. */
export function resolveTheme(overrides) {
  return deepMerge(defaultTheme, overrides || {});
}

/**
 * Resolve one variant ('light' | 'dark'), overrides applied. Falls back to the
 * theme's declared `default` variant when the name is unknown.
 * @returns {{ colorset: object, chart: object, table: object }}
 */
export function getThemeVariant(name, overrides) {
  const theme = resolveTheme(overrides);
  return theme.themes[name] || theme.themes[theme.default];
}

/**
 * Theme → ChartOptions. Returns the variant's `chart` section (already a
 * ChartOptions styling object) with the top-level font `family` attached as
 * `fontFamily`, ready to deep-merge a per-chart spec (data, chartType,
 * axes.x/y.labels, title.text) onto and hand to <XeplrChart> / chartOptionsToOption.
 *
 *   const base = getChartOptions('light', appOverrides);
 *   const chartOptions = deepMerge(base, { data, chartType: 'bar',
 *     axes: { x: { labels: ['month'] }, y: { labels: ['revenue'] } } });
 *
 * @returns {object} a ChartOptions object (styling only + palette + marks + fontFamily)
 */
export function getChartOptions(variantName, overrides) {
  const theme = resolveTheme(overrides);
  const variant = theme.themes[variantName] || theme.themes[theme.default];
  const chart = (variant && variant.chart) || {};
  const family = theme.font && theme.font.family;
  return family ? { ...chart, fontFamily: family } : { ...chart };
}

export { defaultTheme };
export default defaultTheme;
