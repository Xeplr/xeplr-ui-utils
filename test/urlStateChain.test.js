// Two URL writes in one click both land: the second is built on the first,
// not on the query the page last rendered (src/url/useUrlState.js).
import { writeFrom as _writeFrom } from '../src/url/urlState.js'

const results = []
const check = (n, c) => { results.push(c); console.log((c ? '  ok   ' : '  FAIL ') + n) }

const rendered = new URLSearchParams('id=7')
const a = _writeFrom(rendered, { panel: 'filters' })
const b = _writeFrom(rendered, { selected: 'w1' })
check('the second write keeps the first', b.get('panel') === 'filters' && b.get('selected') === 'w1' && b.get('id') === '7')
check('the first is as written', a.toString() === 'id=7&panel=filters')
const after = new URLSearchParams(b.toString())
const c = _writeFrom(after, { panel: null })
check('once the page has re-rendered, writes start from the new query', c.toString() === 'id=7&selected=w1')
const elsewhere = _writeFrom(new URLSearchParams('id=9'), { tab: 'model' })
check('a different page query is not mixed with an old pending write', elsewhere.toString() === 'id=9&tab=model')

const failed = results.filter((x) => !x).length
console.log(`\n${results.length - failed}/${results.length} passed`)
if (failed) process.exit(1)
