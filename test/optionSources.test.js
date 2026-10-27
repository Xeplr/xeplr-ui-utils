import { createOptionSources } from '../src/optionSources/optionSources.js'

const results = []
const check = (name, cond, extra) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond || extra === undefined ? '' : ' — ' + JSON.stringify(extra))) }

console.log('\noption sources')
const asked = []
const DATA = {
  '/connectioninfo': { dataArray: [{ id: 'c1', label: 'ERP', connectionType: 'database' }, { id: 'c2', label: 'Bank', connectionType: 'database' }, { id: 'a1', label: 'Bank API', connectionType: 'api' }] },
  '/dbinfo': { dataArray: [{ id: 'd1', dbName: 'erp_main', connectionId: 'c1' }, { id: 'd2', dbName: 'bank', connectionId: 'c2' }] },
  '/warehouse/tables': { tables: [{ id: 't1', name: 'sales' }] },
  '/params': { params: [{ name: 'from' }, { name: 'to' }] },
  '/auth/api/admin/roles': [{ id: 'r1', name: 'Accounts' }, { id: 'r2', name: 'Sales' }]
}
const fetchJson = async (path) => { asked.push(path); return DATA[path.split('?')[0]] }
const src = createOptionSources({
  connections: { url: '/connectioninfo', value: 'id', label: 'label', where: { connectionType: 'database' } },
  apis: { url: '/connectioninfo', value: 'id', label: 'label', where: { connectionType: 'api' } },
  databases: { url: '/dbinfo', value: 'id', label: 'dbName' },
  tables: { url: '/warehouse/tables', value: 'id', label: 'name', key: 'tables' },
  params: { url: '/params', value: 'name', key: 'params' },
  roles: { url: '/auth/api/admin/roles', value: 'name', label: 'name' }
}, fetchJson)

check('a kind the host listed is offered; one it did not is a text box', src.has('connections') && !src.has('folders') && !src.has(undefined))
const conns = await src.fetchOptions('connections')
check('labels to show, ids to store', JSON.stringify(conns) === '[{"value":"c1","label":"ERP"},{"value":"c2","label":"Bank"}]', conns)
const dbs = await src.fetchOptions('databases', { name: 'connectionId', value: 'c1', clientKey: 'connectionId' })
const apis = await src.fetchOptions('apis')
check('where: only the kind asked for, asked of the server too', JSON.stringify(apis) === '[{"value":"a1","label":"Bank API"}]' && asked.includes('/connectioninfo?limit=0&connectionType=api'), apis)
check('a dependent list is narrowed, on the server and in the browser', dbs.length === 1 && dbs[0].label === 'erp_main' && asked.includes('/dbinfo?limit=0&connectionId=c1'), dbs)
check('a hand-written endpoint answers under its own key', (await src.fetchOptions('tables'))[0].label === 'sales')
check('nothing configured: nothing asked', (await src.fetchOptions('folders')).length === 0 && !asked.some((p) => p.includes('folders')))
check('suggestions are values, asked with everything they need', JSON.stringify(await src.fetchSuggestions('params', { connectionId: 'c1', procedure: 'p' })) === '["from","to"]')
check('...and nothing while something they need is not chosen', (await src.fetchSuggestions('params', { connectionId: 'c1', procedure: '' })).length === 0)

check('an answer that is itself the list is read as one', JSON.stringify(await src.fetchOptions('roles')) === '[{"value":"Accounts","label":"Accounts"},{"value":"Sales","label":"Sales"}]')

const failed = results.filter(([, c]) => !c).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
