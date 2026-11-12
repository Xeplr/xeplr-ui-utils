// The blocking design check: which rules apply now (`when`), what each looks
// for, and how a missing one is named. Run against the real shipped rules'
// shapes; the DOM side is querySelector on whatever root the page has.
import { ruleSelectors, ruleApplies, ruleLabel, missingFrom } from '../src/designCheck/designCheck.js';
import { TEXT_FIELD_RULES } from '../src/textField/validateDesign.js';
import { TEXT_TYPES } from '../src/textField/textField.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

console.log('\ndesign check')
check('id, role, selector and anyOf each say where to look',
  ruleSelectors({ id: 'a' })[0] === '#a' && ruleSelectors({ role: 'listbox' })[0] === '[role="listbox"]' &&
  ruleSelectors({ selector: 'button' })[0] === 'button' && ruleSelectors({ anyOf: ['#x', '#y'] }).length === 2)
check('a rule without when always applies', ruleApplies({ selector: 'a' }, {}))
check('a rule with when applies only while it holds',
  ruleApplies({ selector: 'a', when: (c) => c.open }, { open: true }) && !ruleApplies({ selector: 'a', when: (c) => c.open }, { open: false }))
check('a missing rule is named with where it was looked for', ruleLabel({ id: 'x-email', label: 'Email input' }) === 'Email input (id="x-email")')
check('no root (not rendered yet) reports nothing', missingFrom(null, [{ selector: 'a', label: 'A' }], {}).length === 0)

console.log('\ntext field: password')
check('password is a type', TEXT_TYPES.includes('password'))
const design = readFileSync(fileURLToPath(new URL('../src/textField/designs/TextFieldSample.jsx', import.meta.url)), 'utf8')
check('the design draws a password input for it', design.includes("type === 'password' ? 'password'"))
check('the TextField rule accepts a password input', TEXT_FIELD_RULES[0].selector.includes('input[type="password"]'))

const failed = results.filter(([, ok]) => !ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
