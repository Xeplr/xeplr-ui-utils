// The URL rule every screen uses for "where you are" (src/url/urlState.js).
import { patchSearch, readSearch } from '../src/url/urlState.js'

const results = []
const check = (n, c) => { results.push(c); console.log((c ? '  ok   ' : '  FAIL ') + n) }

check('a value is set', patchSearch('?id=1', { tab: 'model' }).toString() === 'id=1&tab=model')
check('null, undefined, empty and false remove it', patchSearch('?a=1&b=2&c=3&d=4', { a: null, b: undefined, c: '', d: false }).toString() === '')
check('true is 1', patchSearch('', { open: true }).toString() === 'open=1')
check('the default is not written', patchSearch('?tab=model', { tab: 'canvas' }, { tab: 'canvas' }).toString() === '')
check('other keys are kept', patchSearch('?id=7&q=x', { drawer: 'filters' }).get('id') === '7')
const p = new URLSearchParams('?tab=model&x=')
check('read gives the value', readSearch(p, 'tab', 'canvas') === 'model')
check('absent or empty gives the default, else null', readSearch(p, 'x', 'd') === 'd' && readSearch(p, 'nope') === null)

const failed = results.filter((c) => !c).length
console.log(`\n${results.length - failed}/${results.length} passed`)
if (failed) process.exit(1)
