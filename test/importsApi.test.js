// createImportsApi against the REAL @xeplr/imports router: a real Express app,
// real Postgres, a throwaway xeplr_configs. Runs when PG_HOST/PG_PORT/PG_USER/
// PG_PASSWORD/PG_DATABASE are set and @xeplr/imports can be found
// (XEPLR_IMPORTS_DIR, its folder); skipped otherwise. The upload itself is
// XMLHttpRequest (browsers only) and is driven in the browser; here the file
// goes up by fetch and every other call goes through the model.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { createImportsApi, createRunWatcher, checkResult, checkProgressText, sizeText } from '../src/imports/importsApi.js';
import { configureUpload, uploadHeaders } from '../src/fileUpload/uploadFile.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

console.log('\nimportsApi — the model against the real @xeplr/imports routes')

const dir = process.env.XEPLR_IMPORTS_DIR
if (!process.env.PG_HOST || !dir || !fs.existsSync(path.join(dir, 'index.js'))) {
  console.log('  skipped — needs PG_HOST… and XEPLR_IMPORTS_DIR')
  process.exit(0)
}
const req = createRequire(path.join(dir, 'index.js'))
const PG = { host: process.env.PG_HOST, port: Number(process.env.PG_PORT || 5432), user: process.env.PG_USER,
  password: process.env.PG_PASSWORD, database: process.env.PG_DATABASE || 'postgres' }
const CONFIG_DB = 'xeplr_config_uiutils_test'
const TABLE = 'uiutils_imports_' + Date.now().toString(36)

const db = req('@xeplr/db')
db.registerApplication('xeplr-uiutils-test')
db.registerMTs({ l1: { name: 'company', header: 'x-company-id' }, l2: { name: 'workspace', header: 'x-workspace-id' } })
const server = { host: PG.host, port: PG.port, user: PG.user, password: PG.password }
const admin = req('knex')({ client: 'pg', connection: Object.assign({}, server, { database: 'postgres' }), pool: { min: 0, max: 1 } })
await admin.raw('DROP DATABASE IF EXISTS ' + CONFIG_DB)
const boot = await db.bootstrapConfigDb({ connection: server, database: CONFIG_DB, seed: false })
const config = {
  ready: async () => {}, SERVICE_NAME: 'xeplr-uiutils-test',
  metaStore: req('@xeplr/actions/lib/uploader/meta-store-knex')(boot.db, { service: 'xeplr-uiutils-test', applicationId: 'xeplr-uiutils-test' }),
  ImportMeta: req('@xeplr/actions/lib/uploader/attach').ImportMeta.bindKnex(boot.db)
}
// The data root (XEPLR_DATA_DIR): uploads go to <root>/<app>/<company>/<workspace>/uploads.
const uploadDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'uiutils-imports-')))
process.env.XEPLR_DATA_DIR = uploadDir
const pool = new (req('pg').Pool)(PG)
const express = req('express')
const app = express()
app.use(db.mtMiddleware())
// A REAL event stream, the way an app has one: base-apis' sse over HTTP,
// the router told to publish through it to the person's own topic.
const sse = req('@xeplr/base-apis').sse
app.get('/api/events', sse.handler)
app.use((r, res, next) => { r.user = { id: r.headers['x-test-user'] || 'u1', name: 'Tester' }; next() })
app.use('/api/imports', req(dir).router({
  config,
  resolveTarget: async (c, d) => (c === 'pg' && d === 'main' ? { dbType: 'postgres', dbConnection: PG } : null),
  listTargets: async () => [{ connectionId: 'pg', label: 'Local', databases: [{ id: 'main', label: 'Main' }] }],
  publish: (userId, event) => sse.publish('user:' + userId + ':imports', event)
}))
const srv = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
const origin = 'http://127.0.0.1:' + srv.address().port

// The headers an app gives configureUpload are what every call carries.
configureUpload({ getHeaders: () => ({ 'x-company-id': 'c1', 'x-workspace-id': 'w1' }) })
check('uploadHeaders: what configureUpload was given, fresh each time', uploadHeaders()['x-workspace-id'] === 'w1' && uploadHeaders() !== uploadHeaders())
const api = createImportsApi(origin + '/api/imports/')

async function put(name, text) {
  const form = new FormData()
  form.append('file', new Blob([text], { type: 'text/csv' }), name)
  return (await (await fetch(origin + '/api/imports/files', { method: 'POST', headers: uploadHeaders(), body: form })).json()).filePath
}
/** The browser's side of the stream: read the SSE body, hand each event's data to the listeners. */
function openStream(topic) {
  const listeners = new Set()
  const abort = new AbortController()
  const state = { live: false, heard: 0 }
  const ready = (async () => {
    const res = await fetch(origin + '/api/events?topics=' + encodeURIComponent(topic), { signal: abort.signal })
    state.live = true
    const reader = res.body.getReader()
    const text = new TextDecoder()
    let buf = ''
    ;(async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buf += text.decode(value, { stream: true })
          let cut
          while ((cut = buf.indexOf('\n\n')) >= 0) {
            const frame = buf.slice(0, cut)
            buf = buf.slice(cut + 2)
            const line = frame.split('\n').find((l) => l.startsWith('data: '))
            if (!line) continue
            state.heard++
            const data = JSON.parse(line.slice(6)).data
            listeners.forEach((fn) => fn(data))
          }
        }
      } catch (e) { /* closed */ }
      state.live = false
    })()
  })()
  return {
    ready, state,
    events: { subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) }, isLive: () => state.live },
    close: () => abort.abort()
  }
}

async function finish(runId) {
  for (let i = 0; i < 300; i++) {
    const run = await api.run(runId)
    if (run.status !== 'running') return run
    await new Promise((r) => setTimeout(r, 100))
  }
}

try {
  const targets = await api.targets()
  check('targets', targets[0].databases[0].id === 'main')
  const fp = await put('stock.csv', 'sku,qty\nA1,1\nA2,2\n')
  const asked = await api.inspect(fp)
  check('inspect runs in the background: a run id at once', /^imp_/.test(asked.runId || ''))
  const plainWatcher = createRunWatcher({ api, pollMs: 50 })
  const found = checkResult(await plainWatcher.wait(asked.runId))
  check('...and without a stream it is asked about until it ends, giving the inspect answer',
    found.format === 'csv' && found.checks && typeof found.checks === 'object')

  // A big check, heard on the stream.
  const stream = openStream('user:u1:imports')
  await stream.ready
  const lines = ['sku,qty']
  for (let i = 0; i < 400000; i++) lines.push('C' + i + ',' + i)
  const bigFile = await put('check.csv', lines.join('\n'))
  let asks = 0
  const counted = Object.assign({}, api, { run: (id) => { asks++; return api.run(id) } })
  const live = createRunWatcher({ api: counted, events: stream.events, pollMs: 50 })
  const seen = []
  const t0 = Date.now()
  const bigRun = await live.wait((await api.inspect(bigFile)).runId, (p) => seen.push(p))
  const took = Date.now() - t0
  check('a big check ends, heard on the stream: asked once, not every 50 ms (' + asks + ' asks, ' + took + ' ms)',
    bigRun.status === 'complete' && asks === 1 && took < 15000)
  check('its progress came over the stream, saying how far through the file',
    seen.filter(Boolean).length >= 1 && seen.filter(Boolean).every((p) => p.phase === 'checking') && seen.some((p) => p && p.bytesRead > 0 && p.bytes > 0))
  check('the ending carries the answer', checkResult(bigRun).format === 'csv')
  check('progress line: bytes, percent, rows',
    checkProgressText({ phase: 'checking', part: 1, parts: 1, rowsRead: 412000, bytesRead: 1288490189, bytes: 3221225472 }) ===
      'Checking the file · 1.2 GB of 3.0 GB (40%) · ' + (412000).toLocaleString() + ' rows')
  check('progress line: an Excel sheet, rows only',
    checkProgressText({ part: 2, parts: 3, sheet: 'Orders', rowsRead: 12000, bytesRead: null, bytes: 900 }) ===
      'Checking the file · sheet 2 of 3 (Orders) · ' + (12000).toLocaleString() + ' rows')
  check('progress line before anything is heard', checkProgressText(null) === 'Checking the file…')
  check('sizes', sizeText(512 * 1024) === '512 KB' && sizeText(340 * 1024 * 1024) === '340 MB')

  // The run on ANOTHER API process: asking answers 404 there; the stream still carries the ending.
  const elsewhere = Object.assign({}, api, { run: () => Promise.reject(new Error('No such import run')) })
  const far = createRunWatcher({ api: elsewhere, events: stream.events, pollMs: 50 })
  const farRun = await far.wait((await api.inspect(bigFile)).runId)
  check('a run another process holds is still heard ending', farRun.status === 'complete')

  // Stopped: the check says so.
  const toStop = await api.inspect(bigFile)
  await api.stop(toStop.runId)
  let stopMsg = null
  try { checkResult(await live.wait(toStop.runId)) } catch (e) { stopMsg = e.message }
  check('a stopped check says it was stopped', stopMsg === 'The check was stopped.')

  // The stream down: asked every pollMs again.
  stream.close()
  await new Promise((r) => setTimeout(r, 100))
  asks = 0
  const down = await live.wait((await api.inspect(bigFile)).runId)
  check('with the stream down it is asked about until it ends (' + asks + ' asks)', down.status === 'complete' && asks > 1)
  live.close(); far.close(); plainWatcher.close()
  const checked = await api.checkTarget({ filePath: fp, connectionId: 'pg', dbInfoId: 'main', targetTable: TABLE })
  check('checkTarget', checked.exists === false)
  let refused = null
  try { await api.checkTarget({ filePath: fp, connectionId: 'nope', dbInfoId: 'main', targetTable: TABLE }) } catch (e) { refused = e.message }
  check('a refusal rejects with the server\'s own words', refused === 'Database not found')
  const fp2 = await put('stock.csv', 'sku,qty\nA1,1\nA2,2\n')
  const started = await api.commit({ filePath: fp2, connectionId: 'pg', dbInfoId: 'main', originalFileName: 'stock.csv', mappings: [{ targetTable: TABLE, mode: 'new' }] })
  const run = await finish(started.runId)
  check('commit, then run until it ends', run.status === 'complete' && run.result.results[0].rows === 2)
  await pool.query('ALTER TABLE "' + TABLE + '" ADD CONSTRAINT ok CHECK (qty >= 0)')
  const r2 = await finish((await api.commit({ filePath: await put('more.csv', 'sku,qty\nB1,-1\n'), connectionId: 'pg', dbInfoId: 'main', originalFileName: 'more.csv',
    mappings: [{ targetTable: TABLE, mode: 'append' }] })).runId)
  const jobId = r2.result.results[0].jobId
  const history = await api.history()
  check('history', history.length === 2 && history[0].targetTable === TABLE)
  const dropped = await api.dropped(jobId)
  check('dropped', dropped.total === 1 && dropped.rows[0].values.sku === 'B1')
  const file = await api.droppedFile(jobId)
  check('droppedFile: the .xlsx and its name', file.blob.size > 0 && file.name === 'more - dropped rows.xlsx')
  let none = null
  try { await api.droppedFile(history[1].id) } catch (e) { none = e.message }
  check('droppedFile with nothing kept rejects, saying so', /No dropped rows were kept/.test(none || ''))
  check('rollback', (await api.rollback(history[1].id)).mainDeleted === 2)
  check('remove', (await api.remove(jobId)).success === true && (await api.history()).length === 1)
  const big = ['sku,qty']
  for (let i = 0; i < 150000; i++) big.push('S' + i + ',' + i)
  const s3 = await api.commit({ filePath: await put('big.csv', big.join('\n')), connectionId: 'pg', dbInfoId: 'main', mappings: [{ targetTable: TABLE, mode: 'append' }] })
  check('stop', (await api.stop(s3.runId)).stopped === true && (await finish(s3.runId)).status === 'stopped')
  check('the default base path is /imports', typeof createImportsApi().run === 'function')
} catch (err) {
  check('no error: ' + err.message, false)
} finally {
  // An open event stream would keep the server from closing.
  srv.closeAllConnections()
  await new Promise((r) => srv.close(r))
  for (const t of [TABLE + '_import_errors', TABLE]) await pool.query('DROP TABLE IF EXISTS "' + t + '"').catch(() => {})
  await pool.end()
  await boot.db.destroy()
  await admin.raw('DROP DATABASE IF EXISTS ' + CONFIG_DB)
  await admin.destroy()
  fs.rmSync(uploadDir, { recursive: true, force: true })
}

const failed = results.filter(r => !r[1])
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
