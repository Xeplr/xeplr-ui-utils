// Design rules — what a page demands of whatever design is plugged into it.
//
// The rules are data, and the matching is a DOM query, so this checks the
// rules against the markup the shipped design actually produces rather than
// rendering React. What went wrong once was a rule set no design could ever
// satisfy, and that is visible from the rules alone.
import { DATE_RANGE_RULES } from '../src/dateRange/validateDesign.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

const design = readFileSync(fileURLToPath(new URL('../src/dateRange/designs/DateRangeSample.jsx', import.meta.url)), 'utf8')

// The design is tabbed: `{props.tab === 'quick' && ...}` mounts one branch at
// a time. A rule that names something inside a branch can only be satisfied
// while that branch is open.
const branchOf = (tab) => {
  const start = design.indexOf(`props.tab === '${tab}'`)
  const next = ['quick', 'range', 'single']
    .map((t) => design.indexOf(`props.tab === '${t}'`))
    .filter((i) => i > start)
  return design.slice(start, next.length ? Math.min(...next) : design.length)
}
const always = design.slice(0, design.indexOf("props.tab === 'quick'"))

console.log('\nthe design really is tabbed')
check('the quick branch holds the preset list', branchOf('quick').includes('xeplr-daterange-list'))
check('the range branch holds the date inputs', branchOf('range').includes('type="date"'))
check('the single branch holds the text input', branchOf('single').includes('xeplr-daterange-input'))
// This is the fact the old rules ignored.
check('no branch holds both a preset list and a date input',
  !['quick', 'range', 'single'].some((t) => {
    const b = branchOf(t)
    return b.includes('xeplr-daterange-list') && (b.includes('type="date"') || b.includes('xeplr-daterange-input'))
  }))

console.log('\nevery rule is satisfiable')
// What a selector looks like in JSX: `.a b` is written className="a", and
// `input[type="date"]` is written type="date". Reduced to the one token that
// has to appear in the source.
const token = (selector) => selector.trim().split(' ')[0]
  .replace(/^[a-z]+(?=\[)/, '')  // the tag in input[...] isn't in the attribute text
  .replace(/^[.#]/, '')
  .replace(/^\[|\]$/g, '')

for (const rule of DATE_RANGE_RULES) {
  if (rule.anyOf) {
    // An anyOf rule needs at least one alternative in EVERY branch, or there
    // is still a tab on which it cannot pass — which was the whole bug.
    check(`"${rule.label}" is satisfiable on every tab`,
      ['quick', 'range', 'single'].every((t) => rule.anyOf.some((s) => branchOf(t).includes(token(s)))))
  } else {
    // A single-selector rule must match something OUTSIDE the branches, or it
    // fails on every tab that doesn't happen to contain it. That is exactly
    // what crashed: a preset list AND a date input were both required, so
    // whichever tab was open, one of them was missing.
    check(`"${rule.label}" matches something always on screen`,
      rule.selector.split(',').some((s) => always.includes(token(s))))
  }
}

console.log('\nthe rule set as a whole')
check('the tabs are still required', DATE_RANGE_RULES.some((r) => /tab/i.test(r.label)))
check('there is still a rule about entering a date',
  DATE_RANGE_RULES.some((r) => r.anyOf && r.anyOf.some((s) => s.includes('date') || s.includes('preset'))))
// Two mutually exclusive things must be one anyOf rule, never two rules.
check('the preset list and the date input are not separate requirements',
  !DATE_RANGE_RULES.some((r) => r.selector && r.selector.includes('preset')) ||
  !DATE_RANGE_RULES.some((r) => r.selector && r.selector.includes('type="date"')))

const failed = results.filter(([, ok]) => !ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
