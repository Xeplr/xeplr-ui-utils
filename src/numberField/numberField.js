/**
 * NumberField — pure model. No React.
 *
 * Handles the parsing, formatting, and validation of numeric input.
 * Three flavours of value: float, currency, units. Currency and units
 * are numerically the same — they only differ by the affix shown next
 * to the number (a dropdown of currencies or a dropdown of units).
 */

export var NUMBER_TYPES = ['float', 'currency', 'units'];

/**
 * Strip everything that isn't a digit, decimal point, or leading minus.
 * Collapses multiple decimal points to the first one.
 */
export function sanitizeNumberInput(raw) {
  if (raw === null || raw === undefined) return '';
  var str = String(raw);
  var negative = str.charAt(0) === '-';
  str = str.replace(/[^0-9.]/g, '');
  var parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return (negative ? '-' : '') + str;
}

/**
 * Convert a raw string to a Number. Returns null if not a finite number.
 */
export function toNumeric(raw) {
  if (raw === null || raw === undefined || raw === '' || raw === '-') return null;
  var n = Number(raw);
  return isFinite(n) ? n : null;
}

/**
 * Format a numeric value for display. Locale-aware grouping.
 */
export function formatDisplay(value, decimals) {
  if (value === null || value === undefined || value === '') return '';
  var n = Number(value);
  if (!isFinite(n)) return '';
  if (typeof decimals === 'number') {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  return n.toLocaleString();
}

/**
 * Validate a numeric value against optional min/max bounds.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateRange(value, min, max) {
  if (value === null) return { valid: true };
  if (typeof min === 'number' && value < min) {
    return { valid: false, error: 'Value must be at least ' + min };
  }
  if (typeof max === 'number' && value > max) {
    return { valid: false, error: 'Value must be at most ' + max };
  }
  return { valid: true };
}

/**
 * Resolve the affix list and currently-selected affix for a given type.
 * Falls back to a sensible default when the user supplied only one item.
 */
export function resolveAffixState(type, options) {
  options = options || {};
  if (type === 'currency') {
    var currencies = options.currencies || [];
    if (currencies.length === 0) {
      throw new Error('[xeplr-ui-utils:NumberField] type="currency" requires a `currencies` prop with at least one entry like { code: "INR", symbol: "₹" }');
    }
    var defaultCode = options.defaultCurrency || currencies[0].code;
    var selected = currencies.find(function(c) { return c.code === defaultCode; }) || currencies[0];
    return {
      list: currencies,
      selected: selected,
      position: options.currencyPosition || 'before',
      labelKey: 'symbol',
      valueKey: 'code'
    };
  }
  if (type === 'units') {
    var units = options.units || [];
    if (units.length === 0) {
      throw new Error('[xeplr-ui-utils:NumberField] type="units" requires a `units` prop with at least one entry like { value: "kg", label: "kg" }');
    }
    var defaultValue = options.defaultUnit || units[0].value;
    var selectedUnit = units.find(function(u) { return u.value === defaultValue; }) || units[0];
    return {
      list: units,
      selected: selectedUnit,
      position: options.unitPosition || 'after',
      labelKey: 'label',
      valueKey: 'value'
    };
  }
  return null;
}
