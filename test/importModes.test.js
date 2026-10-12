import { buildInitialMappings, IMPORT_MODES, DEFAULT_MODE, targetProblems, blocksImport, canRollback, modeLabel } from '../src/dataImport/dataImport.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }
const levels = (ps) => ps.map(p => p.level).join(',')

console.log('\nimport modes — what the import does to its table, said before it loads')

check('three modes: New table, Append, Replace', IMPORT_MODES.map(m => m.label).join('|') === 'New table|Append|Replace')
check('New table is the default — adding to or emptying a table is chosen, not assumed',
  DEFAULT_MODE === 'new' && buildInitialMappings({ parts: ['A', 'B'] }).every(m => m.mode === 'new') &&
  buildInitialMappings({ originalName: 'x.csv' })[0].mode === 'new')

const none = { exists: false, matched: [], extra: [], missing: [] }
const same = { exists: true, matched: ['sku', 'qty'], extra: [], missing: [] }
check('nothing to say before the check answers', targetProblems('t', 'new', null).length === 0)
check('New, no such table: one will be made', levels(targetProblems('t', 'new', none)) === 'info' && /new table "t" will be created/.test(targetProblems('t', 'new', none)[0].message))
check('Append or Replace, no such table: refused — check the name', ['append', 'replace'].every(m =>
  levels(targetProblems('t', m, none)) === 'error' && /no table "t".*choose New table/.test(targetProblems('t', m, none)[0].message)))
check('New, the table exists: refused — choose Append or Replace', levels(targetProblems('t', 'new', same)) === 'error' &&
  /already exists\. Choose Append .* or Replace/.test(targetProblems('t', 'new', same)[0].message))
check('Append, columns all match: said so', levels(targetProblems('t', 'append', same)) === 'ok' && /All 2 columns match/.test(targetProblems('t', 'append', same)[0].message))
check('Replace always warns it empties the table and cannot be rolled back', levels(targetProblems('t', 'replace', same)) === 'ok,warning' &&
  /removes every row now in "t".*cannot be rolled back/.test(targetProblems('t', 'replace', same)[1].message))

const mixed = { exists: true, matched: ['sku'], extra: ['Remarks'], missing: [{ name: 'note', required: false }, { name: 'code', required: true }] }
const p = targetProblems('t', 'append', mixed)
check('a file column the table lacks: refused, named', p[0].level === 'error' && /1 column the table does not: "Remarks"\. The import would be refused — rename or remove it/.test(p[0].message))
check('a required table column the file lacks: every row refused', p[1].level === 'error' && /needs "code".*every row would be refused/.test(p[1].message))
check('an optional one: left empty', p[2].level === 'info' && /has "note".*it will be left empty/.test(p[2].message))
check('no "all match" when something differs', !p.some(x => x.level === 'ok'))
const many = { exists: true, matched: [], extra: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], missing: [] }
check('a long list is cut: six named, the rest counted', /"f" and 2 more/.test(targetProblems('t', 'append', many)[0].message))

check('an error blocks the import', blocksImport(p) && !blocksImport(targetProblems('t', 'append', same)) && !blocksImport(undefined))
check('a completed Append can be rolled back', canRollback({ status: 'completed', mode: 'append' }) && canRollback({ status: 'completed' }))
check('a Replace cannot — its old rows are gone', !canRollback({ status: 'completed', mode: 'replace' }))
check('a failed import is not rolled back', !canRollback({ status: 'failed', mode: 'append' }) && !canRollback(null))
check('mode labels for the history', modeLabel('replace') === 'Replace' && modeLabel('new') === 'New table' && modeLabel(undefined) === '')

const failed = results.filter(r => !r[1])
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
