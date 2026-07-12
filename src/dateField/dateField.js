/**
 * DateField — pure model. No React.
 *
 * Three flavours:
 *   - 'date'     → ISO date string (YYYY-MM-DD)
 *   - 'datetime' → ISO datetime string (YYYY-MM-DDTHH:mm)
 *   - 'age'      → input is a DOB (date), output value is the DOB but the
 *                  age in years is computed and returned alongside.
 */

export var DATE_TYPES = ['date', 'datetime', 'age'];

export function isValidISODate(s) {
  if (typeof s !== 'string' || s.length === 0) return false;
  var d = new Date(s);
  return !isNaN(d.getTime());
}

/**
 * Calculate completed years between dob and `now`. Returns null if dob is invalid.
 */
export function calculateAge(dob, now) {
  if (!dob) return null;
  var birth = dob instanceof Date ? dob : new Date(dob);
  if (isNaN(birth.getTime())) return null;
  var ref = now || new Date();
  var years = ref.getFullYear() - birth.getFullYear();
  var monthDiff = ref.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    years--;
  }
  return years < 0 ? null : years;
}

/**
 * Map our public type to the underlying <input> type attribute.
 */
export function inputTypeFor(type) {
  if (type === 'datetime') return 'datetime-local';
  return 'date';
}

/**
 * Normalise a Date or string into the format the <input> element expects.
 */
export function toInputValue(value, type) {
  if (!value) return '';
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  var ymd = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  if (type === 'datetime') {
    return ymd + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  return ymd;
}

export function validateBounds(value, min, max) {
  if (!value) return { valid: true };
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return { valid: false, error: 'Invalid date' };
  if (min) {
    var dMin = min instanceof Date ? min : new Date(min);
    if (d < dMin) return { valid: false, error: 'Date is before minimum' };
  }
  if (max) {
    var dMax = max instanceof Date ? max : new Date(max);
    if (d > dMax) return { valid: false, error: 'Date is after maximum' };
  }
  return { valid: true };
}
