/**
 * TextField — pure model. No React.
 *
 * The plain text input, and the two shapes that are the same control with a
 * different edge: a multi-line one and a search one. Kept together because
 * they are one thing to style — an app that wants a bottom-rule-only textbox
 * wants a bottom-rule-only search box too, and splitting them is how those
 * drift apart.
 */

export var TEXT_TYPES = ['text', 'multiline', 'search'];

/**
 * What the control accepts as a value. Anything nullish is the empty string:
 * a controlled input handed `undefined` switches to uncontrolled mid-life and
 * React warns about it, which is a bug that only appears once somebody clears
 * a field.
 */
export function toValue(raw) {
  return raw === null || raw === undefined ? '' : String(raw);
}

/**
 * Trimming is a CHOICE, not a default. " " is a legitimate value in a search
 * box and a mistake in a name field, and only the caller knows which.
 */
export function normalise(raw, options) {
  var value = toValue(raw);
  var opts = options || {};
  if (opts.trim) value = value.trim();
  if (opts.maxLength != null && value.length > opts.maxLength) value = value.slice(0, opts.maxLength);
  return value;
}

/**
 * Whether the value satisfies the constraints, and what to say if not.
 *
 * Returns null when it is fine — so a caller can write `error = validate(...)`
 * and render it directly, rather than unpacking a result object to find out
 * there was nothing wrong.
 */
export function validate(raw, options) {
  var opts = options || {};
  var value = toValue(raw);
  var trimmed = value.trim();

  if (opts.required && !trimmed) return opts.requiredMessage || 'This is required';
  if (opts.minLength != null && trimmed.length > 0 && trimmed.length < opts.minLength) {
    return 'At least ' + opts.minLength + ' characters';
  }
  if (opts.maxLength != null && value.length > opts.maxLength) {
    return 'At most ' + opts.maxLength + ' characters';
  }
  if (opts.pattern) {
    var re = opts.pattern instanceof RegExp ? opts.pattern : new RegExp(opts.pattern);
    if (trimmed && !re.test(trimmed)) return opts.patternMessage || 'That is not a valid value';
  }
  return null;
}

/** How many characters are left, or null when there is no limit to count to. */
export function remaining(raw, maxLength) {
  if (maxLength == null) return null;
  return maxLength - toValue(raw).length;
}
