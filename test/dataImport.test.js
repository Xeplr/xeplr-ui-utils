import { buildInitialMappings, checksFor } from '../src/dataImport/dataImport.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

console.log('\ndataImport model — checks the inspect step found, and their fixes')

const inspected = {
  parts: ['Costing', 'Notes'],
  checks: {
    Costing: [{ key: 'pastedRows', message: '11 cells hold 465 rows', fixLabel: 'Recover them' },
              { key: 'fyi', message: 'just saying' }],
    Notes: [{ key: 'pastedRows', message: '1 cell', fixLabel: 'Recover it', fixDefault: false }]
  }
}
const m = buildInitialMappings(inspected)
check('a part gets its checks', checksFor(inspected, 'Costing').length === 2)
check('a part with none gets none', checksFor({ parts: ['A'] }, 'A').length === 0)
check('a fix is on by default', m[0].fixes.pastedRows === true)
check('...unless the check says otherwise', m[1].fixes.pastedRows === false)
check('a check with no fix offers no choice', !('fyi' in m[0].fixes))
const single = buildInitialMappings({ originalName: 'data.csv', checks: { '': [{ key: 'pastedRows', message: 'x', fixLabel: 'y' }] } })
check('a one-unit file reads its checks under the empty key', single[0].part === null && single[0].fixes.pastedRows === true)

const failed = results.filter(([, ok]) => !ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
