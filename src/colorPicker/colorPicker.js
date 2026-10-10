// ColorPicker — model. A colour and how see-through it is, kept as ONE CSS
// value: '#RRGGBB' when solid, '#RRGGBBAA' when not — a string every browser,
// every style sheet and every saved style already understands. No React here.

/** Soft swatches that read well behind text, light and dark. */
export var DEFAULT_SWATCHES = [
  '#f3f4f6', '#dbe8ff', '#d9f2e3', '#fdecc8', '#fde0d4', '#f8dcf0', '#e6defd',
  '#9ca3af', '#4f7cff', '#22a06b', '#e0a106', '#e5673d', '#d14fa8', '#7c5cff'
];

var HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * '#abc', '#aabbcc' or '#aabbccdd' → { hex: '#aabbcc', opacity: 0–100 }, or
 * null for anything else (no colour).
 */
export function parseColor(value) {
  var m = HEX.exec(String(value || '').trim());
  if (!m) return null;
  var h = m[1].toLowerCase();
  if (h.length === 3) h = h.split('').map(function(c) { return c + c; }).join('');
  var alpha = h.length === 8 ? parseInt(h.slice(6), 16) : 255;
  return { hex: '#' + h.slice(0, 6), opacity: Math.round(alpha / 255 * 100) };
}

/** { hex, opacity } → the one CSS value: '#RRGGBB' when opacity is 100, '#RRGGBBAA' otherwise. */
export function formatColor(hex, opacity) {
  var parsed = parseColor(hex);
  if (!parsed) return null;
  var o = Math.max(0, Math.min(100, Math.round(Number(opacity))));
  if (isNaN(o) || o === 100) return parsed.hex;
  return parsed.hex + Math.round(o / 100 * 255).toString(16).padStart(2, '0');
}

/** Whether two colours are the same swatch, whatever their opacity. */
export function sameHue(a, b) {
  var pa = parseColor(a), pb = parseColor(b);
  return Boolean(pa && pb && pa.hex === pb.hex);
}
