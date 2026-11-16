import { importProgressText, runResults, historyJob, databasesOf, fileNameOf, uploaderFor, ACCEPT } from '../src/imports/importsApi.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }
const throws = (fn, re) => { try { fn(); return false } catch (e) { return re.test(e.message) } }

console.log('\nimports model — the import screen against @xeplr/imports')

check('progress before the first report', importProgressText(null) === 'Importing — reading the file…')
check('progress: rows read and written', importProgressText({ rowsRead: 412000, rowsWritten: 400000 }) === 'Importing · 412,000 rows read · 400,000 written')
check('progress: which sheet of how many', /^Importing · Sheet 2 of 3 \(Orders\)/.test(importProgressText({ mapping: 2, mappings: 3, sheet: 'Orders', rowsRead: 5 })))
check('progress: a Replace moving its rows in says so', /replacing the table$/.test(importProgressText({ rowsRead: 1, phase: 'merging' })))
check('progress: nothing yet', importProgressText({}) === 'Importing · starting')

const done = { status: 'complete', result: { results: [
  { sheet: null, targetTable: 'stock', success: true, rows: 30, dropped: 2, jobId: 'j1', recovered: 465, error: null },
  { sheet: 'B', targetTable: 'b', success: false, rows: null, dropped: null, jobId: 'j2', recovered: null, error: 'already exists' }
] } }
const r = runResults(done)
check('a finished run in the import result shape', r[0].target === 'stock' && r[0].rows === 30 && r[0].dropped === 2 && r[0].jobId === 'j1')
check('...with what a repair recovered', r[0].note === '465 of them recovered from cells they had been pasted into')
check('...and a failed part with its error', r[1].success === false && r[1].error === 'already exists' && r[1].dropped === 0 && r[1].note === null)
check('a run that failed throws its error', throws(() => runResults({ status: 'error', error: 'boom' }), /^boom$/))
check('a stopped run says it was stopped', throws(() => runResults({ status: 'stopped', error: 'Stopped' }), /was stopped/))
check('...or why, when it was the time limit', throws(() => runResults({ status: 'stopped', error: 'took longer than 60 minutes' }), /60 minutes/))
check('a run with no results is an empty list', runResults({ status: 'complete', result: null }).length === 0)

const job = historyJob({ id: 'j', originalFileName: 'a.csv', part: null, targetTable: 't', destination: 'L / M', totalRows: 5,
  rowsLoaded: 4, rowsDropped: 1, mode: 'replace', status: 'completed', startedAt: 'x', errorMessage: null, createdByName: 'V' })
check('a history row in the history page shape', job.target === 't' && job.rows === 5 && job.rowsDropped === 1 && job.mode === 'replace' && job.createdByName === 'V' && job.destination === 'L / M')

const targets = [{ connectionId: 'c1', label: 'A', databases: [{ id: 'd1', label: 'x' }] }, { connectionId: 'c2', label: 'B' }]
check('the databases of the chosen connection', databasesOf(targets, 'c1')[0].id === 'd1')
check('...none for one without, or unknown', databasesOf(targets, 'c2').length === 0 && databasesOf(targets, 'zz').length === 0 && databasesOf(null, 'c1').length === 0)

check('file name: filename* first (accents, ₹)', fileNameOf("attachment; filename=\"x.xlsx\"; filename*=UTF-8''%E2%82%B9%20rows.xlsx", 'f') === '₹ rows.xlsx')
check('...the plain one otherwise', fileNameOf('attachment; filename="stock - dropped rows.xlsx"', 'f') === 'stock - dropped rows.xlsx')
check('...the fallback when there is none', fileNameOf(null, 'dropped rows.xlsx') === 'dropped rows.xlsx')

console.log('\nhow a file is sent')
{
  const sent = []
  const api = { upload: (file, onProgress) => { sent.push(['standard', file.name]); onProgress(100); return Promise.resolve({ filePath: '/u/' + file.name }) } }
  const plain = uploaderFor(api, null)
  await plain({ name: 'a.csv' }, () => {})
  check('without the app\'s own: the standard upload', sent.join() === 'standard,a.csv')
  const own = uploaderFor(api, (file, onProgress, { standard }) => {
    if (file.size < 1000) return standard(file, onProgress)
    sent.push(['pieces', file.name]); return Promise.resolve({ filePath: '/u/big/' + file.name })
  })
  const small = await own({ name: 's.csv', size: 10 }, () => {})
  const big = await own({ name: 'b.parquet', size: 5000 }, () => {})
  check('the app\'s own decides per file: the standard one for a small file, its own for a big one',
    small.filePath === '/u/s.csv' && big.filePath === '/u/big/b.parquet' && sent.map((x) => x.join(':')).slice(1).join() === 'standard:s.csv,pieces:b.parquet')
  check('the files it reads include Parquet', ACCEPT.split(',').indexOf('.parquet') !== -1 && ACCEPT.split(',').indexOf('.csv') !== -1)
}

const failed = results.filter(r => !r[1])
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
