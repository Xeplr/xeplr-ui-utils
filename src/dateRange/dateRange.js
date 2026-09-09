// DateRange — model. A date SELECTION, and how it becomes a real from/to
// range. Pure: no React, no DOM.
//
// One shape covers every way a person names a span of time, which is the
// point. A default set once, a preset that keeps moving, and a range typed by
// hand are all the same value, so an app can fall back between them without
// three different mechanisms.
//
//   { kind: 'quick',  preset: 'current_month' }
//   { kind: 'range',  from: '2022-01-01', to: '2022-03-31' }
//   { kind: 'single', value: '2022-05' }        // a day, a month, or a year
//   null                                         // not set — inherit
//
// EVERYTHING RESOLVES TO A RANGE, including a single date. "May 2022" is the
// range 1–31 May; "2022" is the whole year; "1/1/2022" is that one day. A
// consumer therefore always gets {from, to} and never has to ask which
// comparison was meant — the selection already says.

// April. Overridable per call — a financial year starts in a different month
// in most of the world, and hardcoding one is how a report quietly reports
// the wrong year.
var DEFAULT_FISCAL_START_MONTH = 4

function pad(n) { return String(n).padStart(2, '0') }
function iso(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function lastDay(y, m) { return new Date(y, m + 1, 0).getDate() }

/**
 * The presets people actually ask for. Each resolves against `now`, so a
 * report saved with one stays current instead of freezing on the day it was
 * built — the whole reason to prefer a preset over a literal date.
 */
export const QUICK_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'dby', label: 'Day before yesterday' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'last_30_days', label: 'Last 30 days' },
  { key: 'current_month', label: 'Current month' },
  { key: 'current_mtd', label: 'Current month-to-date' },
  { key: 'last_month', label: 'Last month' },
  { key: 'current_quarter', label: 'Current quarter' },
  { key: 'current_qtd', label: 'Current quarter-to-date' },
  { key: 'last_quarter', label: 'Last quarter' },
  { key: 'current_calendar_year', label: 'Current calendar year' },
  { key: 'current_ytd', label: 'Current year-to-date' },
  { key: 'last_calendar_year', label: 'Last calendar year' },
  { key: 'current_financial_year', label: 'Current financial year' },
  { key: 'current_fytd', label: 'Current financial year-to-date' },
  { key: 'last_financial_year', label: 'Last financial year' }
]

const PRESET_LABEL = new Map(QUICK_PRESETS.map((p) => [p.key, p.label]))

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december']

/**
 * Parses the free text a Single selection accepts: a full date, a month, or a
 * year. Returns a {from, to} range, since a month or a year IS a range.
 *
 * Day-first for the ambiguous slash form (1/2/2022 is 1 February), matching
 * where this is used rather than the American reading.
 */
export function parseSingleDate(text) {
  const raw = String(text || '').trim()
  if (!raw) return null

  // 2022
  let m = /^(\d{4})$/.exec(raw)
  if (m) {
    const y = Number(m[1])
    return { from: iso(y, 0, 1), to: iso(y, 11, 31) }
  }

  // 2022-05 or 2022/05
  m = /^(\d{4})[-/](\d{1,2})$/.exec(raw)
  if (m) {
    const y = Number(m[1]); const mo = Number(m[2]) - 1
    if (mo < 0 || mo > 11) return null
    return { from: iso(y, mo, 1), to: iso(y, mo, lastDay(y, mo)) }
  }

  // 2022-05-17
  m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(raw)
  if (m) {
    const y = Number(m[1]); const mo = Number(m[2]) - 1; const d = Number(m[3])
    if (mo < 0 || mo > 11) return null
    return { from: iso(y, mo, d), to: iso(y, mo, d) }
  }

  // May 2022 / may 2022
  m = /^([A-Za-z]+)\s+(\d{4})$/.exec(raw)
  if (m) {
    const idx = MONTHS.findIndex((name) => name.startsWith(m[1].toLowerCase()))
    if (idx === -1) return null
    const y = Number(m[2])
    return { from: iso(y, idx, 1), to: iso(y, idx, lastDay(y, idx)) }
  }

  // 17/5/2022 — day first.
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(raw)
  if (m) {
    const d = Number(m[1]); const mo = Number(m[2]) - 1; const y = Number(m[3])
    if (mo < 0 || mo > 11) return null
    return { from: iso(y, mo, d), to: iso(y, mo, d) }
  }

  return null
}

function shift(now, days) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  return iso(d.getFullYear(), d.getMonth(), d.getDate())
}

function monthRange(y, m) {
  return { from: iso(y, m, 1), to: iso(y, m, lastDay(y, m)) }
}

/**
 * What somebody might mean, as they type — months and years, never days.
 *
 * A day is faster to finish typing than to pick out of a list, and there are
 * thirty of them. A MONTH is the opposite: "j" is three different months, and
 * each of those is a different year depending on what you were just looking
 * at. That ambiguity is the whole reason to suggest anything.
 *
 * ANCHORED to the year already in play — if the filter currently says
 * Feb 2025, typing "j" offers Jan/Jun/Jul 2025 first, because somebody
 * comparing months is almost always comparing them within a year. Other years
 * follow, so the less common case is one click rather than more typing.
 *
 * @param {string} text     what has been typed so far
 * @param {number} anchor   the year to offer first
 * @param {number} years    how many additional years to offer per month
 */
export function singleDateSuggestions(text, anchor, years) {
  const q = String(text || '').trim().toLowerCase()
  const year = Number(anchor) || new Date().getFullYear()
  const depth = years == null ? 2 : years
  if (!q) return []

  // A year on its own — "202" is a prefix of several, and a whole year is a
  // legitimate answer in its own right.
  if (/^\d{1,4}$/.test(q)) {
    const out = []
    for (let y = year + 1; y >= year - 6; y--) {
      if (String(y).startsWith(q)) out.push({ value: String(y), label: String(y), note: 'the whole year' })
    }
    return out.slice(0, 8)
  }

  // "jan 20", "june 2024" — the month is settled, so only years are open.
  const withYear = /^([a-z]+)\s+(\d{1,4})$/.exec(q)
  const monthQuery = withYear ? withYear[1] : q
  const yearQuery = withYear ? withYear[2] : null
  if (!/^[a-z]+$/.test(monthQuery)) return []

  const hits = []
  MONTHS.forEach((name, i) => {
    if (!name.startsWith(monthQuery)) return
    hits.push({ name: name.charAt(0).toUpperCase() + name.slice(1), index: i })
  })
  if (!hits.length) return []

  // The anchor year first for every match, THEN the other years — so a list
  // of three months reads Jan/Jun/Jul 2025 before it reads Jan 2024, rather
  // than burying two of this year's months under last year's January.
  const out = []
  const push = (m, y) => {
    if (yearQuery && !String(y).startsWith(yearQuery)) return
    out.push({ value: m.name + ' ' + y, label: m.name + ' ' + y, note: null })
  }
  hits.forEach((m) => push(m, year))
  for (let d = 1; d <= depth; d++) {
    hits.forEach((m) => push(m, year - d))
  }
  hits.forEach((m) => push(m, year + 1))
  return out.slice(0, 10)
}

export function resolveQuickPreset(preset, now, options) {
  const fiscalStart = ((options && options.fiscalStartMonth) || DEFAULT_FISCAL_START_MONTH) - 1
  const y = now.getFullYear()
  const m = now.getMonth()
  const today = iso(y, m, now.getDate())
  const q = Math.floor(m / 3)
  // The fiscal year containing `now` began this calendar year only if we're
  // already past its start month — same rule as shared/params.js.
  const fy = m >= fiscalStart ? y : y - 1

  switch (preset) {
    case 'today': return { from: today, to: today }
    case 'yesterday': return { from: shift(now, 1), to: shift(now, 1) }
    case 'dby': return { from: shift(now, 2), to: shift(now, 2) }
    case 'last_7_days': return { from: shift(now, 6), to: today }
    case 'last_30_days': return { from: shift(now, 29), to: today }

    case 'current_month': return monthRange(y, m)
    case 'current_mtd': return { from: iso(y, m, 1), to: today }
    case 'last_month': return m === 0 ? monthRange(y - 1, 11) : monthRange(y, m - 1)

    case 'current_quarter': return { from: iso(y, q * 3, 1), to: iso(y, q * 3 + 2, lastDay(y, q * 3 + 2)) }
    case 'current_qtd': return { from: iso(y, q * 3, 1), to: today }
    case 'last_quarter': {
      const ly = q === 0 ? y - 1 : y
      const lq = q === 0 ? 3 : q - 1
      return { from: iso(ly, lq * 3, 1), to: iso(ly, lq * 3 + 2, lastDay(ly, lq * 3 + 2)) }
    }

    case 'current_calendar_year': return { from: iso(y, 0, 1), to: iso(y, 11, 31) }
    case 'current_ytd': return { from: iso(y, 0, 1), to: today }
    case 'last_calendar_year': return { from: iso(y - 1, 0, 1), to: iso(y - 1, 11, 31) }

    case 'current_financial_year': {
      const end = new Date(fy + 1, fiscalStart, 0)
      return { from: iso(fy, fiscalStart, 1), to: iso(end.getFullYear(), end.getMonth(), end.getDate()) }
    }
    case 'current_fytd': return { from: iso(fy, fiscalStart, 1), to: today }
    case 'last_financial_year': {
      const end = new Date(fy, fiscalStart, 0)
      return { from: iso(fy - 1, fiscalStart, 1), to: iso(end.getFullYear(), end.getMonth(), end.getDate()) }
    }

    default: return null
  }
}

/**
 * A selection -> { from, to }, or null when it resolves to nothing.
 *
 * A null result is "no constraint", never "match nothing" — an unresolvable
 * selection must widen rather than silently empty the report.
 */
export function resolveDateValue(value, now, options) {
  if (!value) return null
  if (value.kind === 'quick') return resolveQuickPreset(value.preset, now || new Date(), options)
  if (value.kind === 'single') return parseSingleDate(value.value)
  if (value.kind === 'range') {
    const from = value.from || null
    const to = value.to || null
    if (!from && !to) return null
    return { from, to }
  }
  return null
}

/** What the chip and the panel read. */
export function dateValueLabel(value) {
  if (!value) return null
  if (value.kind === 'quick') return PRESET_LABEL.get(value.preset) || value.preset
  if (value.kind === 'single') return value.value || null
  if (value.kind === 'range') {
    if (value.from && value.to) return `${value.from} → ${value.to}`
    if (value.from) return `From ${value.from}`
    if (value.to) return `Until ${value.to}`
    return null
  }
  return null
}

/**
 * True when a selection would actually constrain anything.
 *
 * Defined as "resolves to a range", NOT "has something typed in it". A Single
 * holding unparseable text has a label but no range — treating that as set
 * would let it pass a "do we have a default?" check and then silently apply no
 * filter at all, which is the worst of both.
 */
export function dateValueIsSet(value, now) {
  return Boolean(resolveDateValue(value, now || new Date()))
}
