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

/**
 * Theme → the CSS custom properties an input control reads.
 *
 * One control at a time, because the sections are separate: `input.text` and
 * `input.select` are the same shape and need not hold the same values.
 *
 * Every edge is emitted on its own — border-top-width, -right, -bottom, -left
 * — so "bottom rule only" is `{ border: { top: false, left: false, right:
 * false, bottom: true } }` and not a fork of the stylesheet.
 *
 *   <div style={inputStyleVars('text', overrides)}>…</div>
 *
 * @param {'text'|'select'|'number'|'date'} control
 * @param {object} [overrides]     consumer theme overrides
 * @param {string} [variantName]
 * @returns {object} { '--xeplr-input-text-…': value }
 */
export function inputStyleVars(control, overrides, variantName) {
  const theme = resolveTheme(overrides);
  const variant = theme.themes[variantName] || theme.themes[theme.default];
  const input = (variant && variant.input && variant.input[control]) || {};
  const p = '--xeplr-input-' + control;
  const border = input.border || {};
  const font = input.font || {};
  const label = input.label || {};
  const ring = input.focusRing || {};
  const invalid = input.invalid || {};

  // An edge that is false is 0 — not "absent", which would fall through to the
  // stylesheet's own default and quietly put the border back.
  const edge = (on) => (on === false ? '0' : (border.width || '1px'));

  const out = {
    [p + '-gap']: input.gap,
    [p + '-padding']: input.padding,
    [p + '-bg']: input.background,
    [p + '-color']: font.color,
    [p + '-font-size']: font.size,
    [p + '-placeholder']: font.placeholder,
    [p + '-border-style']: border.style,
    [p + '-border-color']: border.color,
    [p + '-border-hover']: border.hover,
    [p + '-border-focus']: border.focus,
    [p + '-border-top']: edge(border.top),
    [p + '-border-right']: edge(border.right),
    [p + '-border-bottom']: edge(border.bottom),
    [p + '-border-left']: edge(border.left),
    [p + '-radius']: border.radius,
    // The label carries the FULL Font block — the same shape
    // @xeplr/ui-charts' type.js defines, so `underline` means the same thing
    // on a field label as on a chart's. Every one of them is emitted, because
    // a property the theme accepts and the stylesheet ignores is a setting
    // that silently does nothing.
    [p + '-label-family']: label.family,
    [p + '-label-size']: label.size,
    [p + '-label-weight']: label.weight,
    [p + '-label-style']: label.style,
    [p + '-label-variant']: label.variant,
    [p + '-label-color']: label.color,
    [p + '-label-line-height']: label.lineHeight,
    [p + '-label-spacing']: label.letterSpacing,
    [p + '-label-align']: label.align,
    [p + '-label-transform']: label.transform,
    [p + '-label-decoration']: label.decoration,
    [p + '-label-opacity']: label.opacity,
    [p + '-help-family']: (input.help || {}).family,
    [p + '-help-size']: (input.help || {}).size,
    [p + '-help-color']: (input.help || {}).color,
    [p + '-help-style']: (input.help || {}).style,
    [p + '-help-decoration']: (input.help || {}).decoration,
    [p + '-ring']: ring.width,
    [p + '-ring-color']: ring.color,
    [p + '-invalid-color']: invalid.color,
    [p + '-invalid-ring']: invalid.ring
  };
  // Undefined would render as the string "undefined" in a style object.
  Object.keys(out).forEach((k) => { if (out[k] === undefined) delete out[k]; });
  return out;
}

export { defaultTheme };
export default defaultTheme;
