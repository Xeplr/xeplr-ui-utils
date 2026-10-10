// Every rule of the panel kit names something its shipped design really draws,
// so the ready-made page never reports its own design as invalid.
import { COLOR_PICKER_RULES } from '../src/colorPicker/validateDesign.js';
import { EXPANDERS_RULES, SETTINGS_TREE_RULES } from '../src/panel/validateDesign.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }
const source = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')
// `.a` is written className="a", `[role="option"]` is written role="option".
const token = (s) => s.trim().replace(/^\[|\]$/g, '').replace(/^\./, '')

console.log('\npanel kit design rules')
for (const [name, rules, file] of [
  ['ColorPicker', COLOR_PICKER_RULES, '../src/colorPicker/designs/ColorPickerSample.jsx'],
  ['Expanders', EXPANDERS_RULES, '../src/panel/designs/ExpandersSample.jsx'],
  ['SettingsTree', SETTINGS_TREE_RULES, '../src/panel/designs/SettingsTreeSample.jsx']
]) {
  const design = source(file)
  for (const rule of rules) {
    check(`${name}: "${rule.label}" is drawn by its design`,
      rule.selector.split(',').some((s) => design.includes(token(s).replace(/"/g, '')) || design.includes(token(s))))
  }
}

const failed = results.filter(([, ok]) => !ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
