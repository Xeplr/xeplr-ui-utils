import { droppedCount, droppedTable, droppedAsTsv, droppedSummary, tsvCell } from '../src/dataImport/droppedRows.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

console.log('\ndroppedRows model — the rows an import dropped, shown, copied and counted')

const data = {
  columns: ['sku', 'qty', 'note.text'],
  rows: [
    { rowNum: 5, reason: 'violates check constraint [23514]', values: { sku: 'S5', qty: -1, 'note.text': 'a\tb' } },
    { rowNum: 20, reason: 'violates check constraint [23514]', values: { sku: 'S20', qty: -1, 'note.text': 'say "hi"\nthen go' } },
    { rowNum: null, reason: '', values: { sku: 'S21', qty: null, extra: { a: 1 } } }
  ],
  total: 3,
  dropped: 3
}

check('a count from a history row', droppedCount({ rowsDropped: '63' }) === 63)
check('...or from an import result', droppedCount({ dropped: 2 }) === 2)
check('...none for nothing', droppedCount(null) === 0 && droppedCount({}) === 0)

const t = droppedTable(data)
check('the table: Row, the reason, then the file\'s columns in order',
  JSON.stringify(t.columns.map(c => c.header)) === '["Row","Why it was dropped","sku","qty","note.text"]')
check('...keyed by position, so a dot in a name is not read as a path', t.columns[4].key === 'c2' && t.rows[0].c2 === 'a\tb')
check('...each row with its place and reason', t.rows[1].rowNum === 20 && /check constraint/.test(t.rows[1].reason))
check('...an empty value is blank, not "null"', t.rows[2].c1 === '' && t.rows[2].rowNum === '')

const tsv = droppedAsTsv(data).split('\r\n')
check('copy: a header of the file\'s columns only — no Row, no reason', tsv[0] === 'sku\tqty\tnote.text')
check('...then a line per row', tsv.length >= 4 && tsv[1].startsWith('S5\t-1\t'))
check('...a value with a tab is quoted, as Excel copies it', tsv[1] === 'S5\t-1\t"a\tb"')
check('...quotes doubled and a line break kept inside the quotes', droppedAsTsv(data).includes('"say ""hi""\nthen go"'))
check('tsvCell leaves plain text alone', tsvCell('plain') === 'plain' && tsvCell(null) === '' && tsvCell(4) === '4')

const job = { id: 'j1', rowsDropped: 63, originalFileName: 'ABC.csv', target: 'abc' }
check('heading: how many, from which file, into which table', droppedSummary(job, null).heading === '63 rows dropped from ABC.csv → abc')
check('...one row is "row"', droppedSummary({ dropped: 1 }, null).heading === '1 row dropped')
check('no note while loading', droppedSummary(job, null).note === null)
check('an import from before rows were kept says so',
  /were not kept/.test(droppedSummary(job, { columns: [], rows: [], total: 0, dropped: 63 }).note))
check('fewer kept than dropped says why',
  /Only 5 rows of 63 were kept/.test(droppedSummary(job, { columns: [], rows: new Array(5).fill({}), total: 5, dropped: 63 }).note))
check('a long list says it shows the first ones, and download has all',
  /Showing the first 1,000 of 2,000\. Download has all/.test(droppedSummary(job, { columns: [], rows: new Array(1000).fill({}), total: 2000, dropped: 2000 }).note))
check('all of them here: no note', droppedSummary(job, data).note === null)

const failed = results.filter(r => !r[1])
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
