// Date SELECTIONS and how they become a real range.
//
// Everything resolves to {from, to}, including a single date — "May 2022" is
// the range 1–31 May. That's what lets the date filter have no operator to
// choose, and it's the property most of these check.
import { resolveDateValue, resolveQuickPreset, parseSingleDate, dateValueLabel, dateValueIsSet, QUICK_PRESETS } from '../src/dateRange/dateRange.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

// Wednesday 29 July 2026. Fixed, because a preset that resolves against the
// real clock is a test that fails on the 1st of the month.
const NOW = new Date(2026, 6, 29)
const on = (preset) => resolveQuickPreset(preset, NOW)

console.log('\nquick presets')

check('today is a single day', JSON.stringify(on('today')) === '{"from":"2026-07-29","to":"2026-07-29"}')
check('yesterday steps back one', on('yesterday').from === '2026-07-28')
check('day before yesterday steps back two', on('dby').from === '2026-07-27')
check('last 7 days INCLUDES today (7 days, not 8)',
  on('last_7_days').from === '2026-07-23' && on('last_7_days').to === '2026-07-29')
check('last 30 days likewise', on('last_30_days').from === '2026-06-30')

check('current month is the whole month, not month-to-date',
  JSON.stringify(on('current_month')) === '{"from":"2026-07-01","to":"2026-07-31"}')
check('month-to-date stops at today', on('current_mtd').to === '2026-07-29')
check('last month is the whole previous month',
  JSON.stringify(on('last_month')) === '{"from":"2026-06-01","to":"2026-06-30"}')

check('current quarter covers three months',
  JSON.stringify(on('current_quarter')) === '{"from":"2026-07-01","to":"2026-09-30"}')
check('quarter-to-date stops at today', on('current_qtd').to === '2026-07-29')
check('last quarter is the previous three',
  JSON.stringify(on('last_quarter')) === '{"from":"2026-04-01","to":"2026-06-30"}')

check('calendar year is Jan to Dec',
  JSON.stringify(on('current_calendar_year')) === '{"from":"2026-01-01","to":"2026-12-31"}')
check('year-to-date stops at today', on('current_ytd').to === '2026-07-29')
check('last calendar year', on('last_calendar_year').from === '2025-01-01')

// The fiscal year defaults to starting in April.
check('financial year runs April to March',
  JSON.stringify(on('current_financial_year')) === '{"from":"2026-04-01","to":"2027-03-31"}')
check('financial year-to-date stops at today', on('current_fytd').to === '2026-07-29')
check('last financial year', JSON.stringify(on('last_financial_year')) === '{"from":"2025-04-01","to":"2026-03-31"}')

// In February, the financial year that CONTAINS today began the previous
// April — the off-by-one that a naive implementation gets wrong.
{
  const feb = new Date(2026, 1, 10)
  check('before April, the financial year began the PREVIOUS April',
    resolveQuickPreset('current_financial_year', feb).from === '2025-04-01')
}

// Year boundaries.
{
  const jan = new Date(2026, 0, 15)
  check('last month from January is December of the previous year',
    JSON.stringify(resolveQuickPreset('last_month', jan)) === '{"from":"2025-12-01","to":"2025-12-31"}')
  check('last quarter from Q1 is Q4 of the previous year',
    JSON.stringify(resolveQuickPreset('last_quarter', jan)) === '{"from":"2025-10-01","to":"2025-12-31"}')
}

// A leap-year February must end on the 29th.
{
  const feb = new Date(2024, 1, 10)
  check('February in a leap year ends on the 29th',
    resolveQuickPreset('current_month', feb).to === '2024-02-29')
}

check('every listed preset actually resolves',
  QUICK_PRESETS.every((p) => Boolean(on(p.key))))
check('an unknown preset resolves to nothing rather than throwing', on('nonsense') === null)

console.log('\nsingle dates — a month or a year IS a range')

check('a year is the whole year',
  JSON.stringify(parseSingleDate('2022')) === '{"from":"2022-01-01","to":"2022-12-31"}')
check('a month name and year is that whole month',
  JSON.stringify(parseSingleDate('May 2022')) === '{"from":"2022-05-01","to":"2022-05-31"}')
check('month names are case-insensitive and abbreviate',
  JSON.stringify(parseSingleDate('may 2022')) === JSON.stringify(parseSingleDate('May 2022')))
check('an abbreviated month works', parseSingleDate('Feb 2022').to === '2022-02-28')
check('ISO year-month is that month', parseSingleDate('2022-05').to === '2022-05-31')
check('a full ISO date is one day',
  JSON.stringify(parseSingleDate('2022-05-17')) === '{"from":"2022-05-17","to":"2022-05-17"}')

// Day-first for the slash form, matching where this is used.
check('1/2/2022 is 1 February, not 2 January',
  JSON.stringify(parseSingleDate('1/2/2022')) === '{"from":"2022-02-01","to":"2022-02-01"}')

check('a February date in a leap year is fine', parseSingleDate('February 2024').to === '2024-02-29')
check('nonsense is null, not a guess', parseSingleDate('sometime last year') === null)
check('an impossible month is null', parseSingleDate('2022-13') === null)
check('empty is null', parseSingleDate('') === null && parseSingleDate(null) === null)

console.log('\nresolving a selection')

check('a quick selection resolves',
  resolveDateValue({ kind: 'quick', preset: 'current_month' }, NOW).from === '2026-07-01')
check('a range passes through',
  JSON.stringify(resolveDateValue({ kind: 'range', from: '2022-01-01', to: '2022-03-31' })) === '{"from":"2022-01-01","to":"2022-03-31"}')
check('a one-sided range is legitimate — "everything since April"',
  JSON.stringify(resolveDateValue({ kind: 'range', from: '2022-04-01', to: '' })) === '{"from":"2022-04-01","to":null}')
check('an empty range resolves to nothing', resolveDateValue({ kind: 'range', from: '', to: '' }) === null)
check('null resolves to nothing', resolveDateValue(null, NOW) === null)
// Unresolvable must WIDEN, never empty the report.
check('an unparseable single resolves to nothing, not to an empty range',
  resolveDateValue({ kind: 'single', value: 'garbage' }) === null)

console.log('\nlabels')

check('a preset reads as its label', dateValueLabel({ kind: 'quick', preset: 'last_month' }) === 'Last month')
check('a range reads as both ends', dateValueLabel({ kind: 'range', from: '2022-01-01', to: '2022-03-31' }) === '2022-01-01 → 2022-03-31')
check('a one-sided range says which side', dateValueLabel({ kind: 'range', from: '2022-01-01' }) === 'From 2022-01-01')
check('nothing set has no label', dateValueLabel(null) === null)
check('dateValueIsSet is true for a resolvable selection', dateValueIsSet({ kind: 'quick', preset: 'today' }))
check('...false for nothing', !dateValueIsSet(null))
// "Set" means RESOLVES, not "has text in it". Unparseable text has a label but
// no range; counting it as set would let it pass a "do we have a default?"
// check and then silently filter nothing.
check('...and false for text that does not parse', !dateValueIsSet({ kind: 'single', value: 'garbage' }))
check('...true once the text does parse', dateValueIsSet({ kind: 'single', value: 'May 2022' }))


const failed = results.filter(([, ok]) => !ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
