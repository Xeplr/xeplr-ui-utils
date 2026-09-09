import { emptyRange, normalizeRange, rangeIsSet, RANGE_TYPES } from '../src/rangeField/rangeField.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

console.log('\nrangeField model')

check('emptyRange is both sides blank', JSON.stringify(emptyRange()) === '{"from":"","to":""}')
check('normalizeRange fills in a missing side', JSON.stringify(normalizeRange({ from: '2026-01-01' })) === '{"from":"2026-01-01","to":""}')
check('normalizeRange handles null/undefined without throwing', JSON.stringify(normalizeRange(null)) === '{"from":"","to":""}')
check('rangeIsSet is false for an empty range', rangeIsSet(emptyRange()) === false)
check('rangeIsSet is true with only one side set (open-ended is a real range)', rangeIsSet({ from: '2026-01-01', to: '' }) === true)
check('RANGE_TYPES has date and datetime, not age', JSON.stringify(RANGE_TYPES) === '["date","datetime"]')

const failed = results.filter(([, cond]) => !cond)
console.log(failed.length ? `\n${failed.length} failed` : '\nall passed')
process.exit(failed.length ? 1 : 0)
