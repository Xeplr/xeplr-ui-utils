/**
 * RangeField — pure model. No React.
 *
 * NOT DateRange (see ../dateRange) — that's a full quick-preset/range/single
 * POPOVER picker, built for a report filter that also needs to remember "the
 * last 30 days" as a living selection. This is just the two-input pair
 * itself: a From and a To, rendered as one field, for a caller that already
 * knows it wants an explicit range and has nowhere to put a popover (a
 * wizard step, a form section) — DateRange's own Range tab is exactly this
 * shape internally and could sit on top of this instead of duplicating it.
 *
 * Two flavours, mirroring dateField's (minus 'age' — a range of ages isn't
 * a thing):
 *   - 'date'     → ISO date strings (YYYY-MM-DD)
 *   - 'datetime' → ISO datetime strings (YYYY-MM-DDTHH:mm)
 */
export var RANGE_TYPES = ['date', 'datetime'];

export function emptyRange() {
  return { from: '', to: '' };
}

export function normalizeRange(range) {
  return { from: (range && range.from) || '', to: (range && range.to) || '' };
}

export function rangeIsSet(range) {
  return Boolean(range && (range.from || range.to));
}
