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
import { createImportsApi } from '../src/imports/importsApi.js';
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
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uiutils-imports-'))
process.env.UPLOAD_DIR = uploadDir
const pool = new (req('pg').Pool)(PG)
const express = req('express')
const app = express()
app.use(db.mtMiddleware())
app.use((r, res, next) => { r.user = { id: r.headers['x-test-user'] || 'u1', name: 'Tester' }; next() })
app.use('/api/imports', req(dir).router({
  config,
  resolveTarget: async (c, d) => (c === 'pg' && d === 'main' ? { dbType: 'postgres', dbConnection: PG } : null),
  listTargets: async () => [{ connectionId: 'pg', label: 'Local', databases: [{ id: 'main', label: 'Main' }] }]
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
  const found = await api.inspect(fp)
  check('inspect', found.format === 'csv' && found.checks && typeof found.checks === 'object')
  const checked = await api.checkTarget({ filePath: fp, connectionId: 'pg', dbInfoId: 'main', targetTable: TABLE })
  check('checkTarget', checked.exists === false)
  let refused = null
  try { await api.checkTarget({ filePath: fp, connectionId: 'nope', dbInfoId: 'main', targetTable: TABLE }) } catch (e) { refused = e.message }
  check('a refusal rejects with the server\'s own words', refused === 'Database not found')
  const started = await api.commit({ filePath: fp, connectionId: 'pg', dbInfoId: 'main', originalFileName: 'stock.csv', mappings: [{ targetTable: TABLE, mode: 'new' }] })
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
} finally {
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
