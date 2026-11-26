// A run watcher closed and opened again (React StrictMode in development:
// mount → cleanup → mount) still hears a run finish. Against a real HTTP
// server answering /runs/:id the way @xeplr/imports does.
import http from 'http';
import { configureUpload } from '../src/fileUpload/uploadFile.js';
import { createImportsApi, createRunWatcher } from '../src/imports/importsApi.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }
console.log('\ncreateRunWatcher — closed then opened again still hears the run end')

let asks = 0
const server = http.createServer((req, res) => {
  asks++
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ id: 'r1', kind: 'check', status: asks < 2 ? 'running' : 'complete', progress: { rowsRead: asks } }))
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
configureUpload({ getHeaders: () => ({}) })
const api = createImportsApi('http://127.0.0.1:' + server.address().port + '/imports')

// A stream that remembers whether anyone listens.
let listeners = 0
const events = { subscribe: () => { listeners++; return () => { listeners-- } }, isLive: () => false }

const watcher = createRunWatcher({ api, events, pollMs: 20 })
check('listening once made', listeners === 1)
watcher.close()            // StrictMode's cleanup
check('closed: no longer listening', listeners === 0)
watcher.open()             // StrictMode's second mount
watcher.open()             // a second open does not listen twice
check('opened again: listening once', listeners === 1)

const run = await Promise.race([
  watcher.wait('r1'),
  new Promise((r) => setTimeout(() => r('timed out'), 3000))
])
check('the run is heard finishing after close → open', run !== 'timed out' && run.status === 'complete' && asks >= 2)

watcher.close()
server.close()
const failed = results.filter((r) => !r[1])
console.log(failed.length ? `\n${failed.length} failed` : `\n${results.length} passed`)
process.exit(failed.length ? 1 : 0)
