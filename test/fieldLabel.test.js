import { fieldLabel } from '../src/fields/fieldLabel.js'

const results = []
const check = (name, cond, extra) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond || extra === undefined ? '' : ' — ' + JSON.stringify(extra))) }

console.log('\nfield labels')
const l = (name) => fieldLabel({ name })
check('a saved connection and its database read as the thing, not the id', l('connectionInfoId') === 'Connection' && l('dbInfoId') === 'Database', [l('connectionInfoId'), l('dbInfoId')])
check('snake and camel case become words', l('streaming_mode') === 'Streaming mode' && l('batchSize') === 'Batch size' && l('filenameContains') === 'Filename contains')
check('known words keep their spelling', l('sql') === 'SQL' && l('jobsUrl') === 'Jobs URL' && l('timeoutMs') === 'Timeout (ms)', [l('jobsUrl'), l('timeoutMs')])
check('a label of its own wins', fieldLabel({ name: 'x', label: 'Which sheet' }) === 'Which sheet')
check('nothing is nothing', fieldLabel(null) === '' && fieldLabel({}) === '')

const failed = results.filter(([, c]) => !c).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
