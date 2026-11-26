// An expired sign-in renews once and the request is asked again — against a
// real HTTP server that refuses any token but the current one with 401, the
// way @xeplr/auth refuses a dead one.
import http from 'http';
import { configureUpload, signedFetch, renewSignIn, renewAndRetry } from '../src/fileUpload/uploadFile.js';
import { createImportsApi } from '../src/imports/importsApi.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }
console.log('\nsignedFetch — renew an expired sign-in once, then ask again')

let current = 'fresh-1'
const seen = []
const server = http.createServer((req, res) => {
  seen.push({ url: req.url, auth: req.headers.authorization, company: req.headers['x-company-id'] })
  if (req.headers.authorization !== 'Bearer ' + current) {
    res.writeHead(401, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'Token expired' })); return
  }
  res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, dataArray: [{ id: 't1' }] }))
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = 'http://127.0.0.1:' + server.address().port

let stored = 'stale'
let renewals = 0
configureUpload({ getHeaders: () => ({ Authorization: 'Bearer ' + stored, 'x-company-id': 'c1' }) })

check('no renew configured: renewSignIn says no', (await renewSignIn()) === false)
let res = await signedFetch(base + '/x')
check('no renew configured: the 401 is the answer', res.status === 401 && seen.length === 1)

configureUpload({ renew: async () => { renewals++; stored = current; return true } })
seen.length = 0
res = await signedFetch(base + '/x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
check('expired: renewed once and asked again → 200', res.status === 200 && renewals === 1 && seen.length === 2)
check('the second ask carries the NEW token and keeps the tenant header',
  seen[1].auth === 'Bearer fresh-1' && seen[1].company === 'c1')

seen.length = 0
res = await signedFetch(base + '/x')
check('a good token: one request, no renewal', res.status === 200 && seen.length === 1 && renewals === 1)

configureUpload({ renew: async () => { renewals++; return false } })
current = 'fresh-2'; seen.length = 0
res = await signedFetch(base + '/x')
check('renewal refused (session dead): one retry-free 401', res.status === 401 && seen.length === 1)

configureUpload({ renew: async () => { throw new Error('network') } })
check('a renew that throws counts as no', (await renewSignIn()) === false)

// The Imports page's calls go through it too.
configureUpload({ renew: async () => { renewals++; stored = current; return true } })
stored = 'stale'; seen.length = 0
const api = createImportsApi(base + '/imports')
const targets = await api.targets()
check('imports call: renewed and answered', targets.length === 1 && seen.length === 2 && seen[1].auth === 'Bearer fresh-2')

// The rule uploadFile's XHR follows (XHR itself runs only in a browser).
configureUpload({ renew: async () => true })
check('renewAndRetry: not a 401 → keep the answer', renewAndRetry(200, false, () => 'again') === null)
check('renewAndRetry: already retried → keep the answer', renewAndRetry(401, true, () => 'again') === null)
check('renewAndRetry: 401 → renew, then retry', (await renewAndRetry(401, false, () => 'again')) === 'again')
configureUpload({ renew: async () => false })
check('renewAndRetry: 401 and renewal refused → null', (await renewAndRetry(401, false, () => 'again')) === null)

// The dropped-rows download is signed and renewed the same way.
configureUpload({ renew: async () => { stored = current; return true } })
stored = 'stale'; seen.length = 0
const dropped = await api.droppedFile('h1')
check('dropped-rows download: renewed and fetched', seen.length === 2 && dropped.blob.size > 0)

server.close()
const failed = results.filter((r) => !r[1])
console.log(failed.length ? `\n${failed.length} failed` : `\n${results.length} passed`)
process.exit(failed.length ? 1 : 0)
