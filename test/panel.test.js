import { toggleOpen, initialOpen, toggleBranch, decorateTree } from '../src/panel/panel.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const items = [{ key: 'text' }, { key: 'fill' }, { key: 'border' }]

console.log('\npanel model')

check('the first item is open at first', eq(initialOpen(items), ['text']))
check('or the one asked for', eq(initialOpen(items, 'fill'), ['fill']))
check('null opens none', eq(initialOpen(items, null), []))
check('a key the panel does not have is dropped', eq(initialOpen(items, 'nope'), []))
check('one at a time keeps only the first of several', eq(initialOpen(items, ['fill', 'border']), ['fill']))
check('multiple keeps them all', eq(initialOpen(items, ['fill', 'border'], true), ['fill', 'border']))
check('opening one closes the other', eq(toggleOpen(['text'], 'fill'), ['fill']))
check('clicking the open one closes it', eq(toggleOpen(['text'], 'text'), []))
check('multiple adds', eq(toggleOpen(['text'], 'fill', true), ['text', 'fill']))
check('multiple removes only that one', eq(toggleOpen(['text', 'fill'], 'text', true), ['fill']))

console.log('\nsettings tree model')
check('opening a group records it under the root', eq(toggleBranch({}, '', 'header'), { '': 'header' }))
check('opening a sibling closes the other', eq(toggleBranch({ '': 'header' }, '', 'rows'), { '': 'rows' }))
check('clicking the open one closes it', eq(toggleBranch({ '': 'header' }, '', 'header'), {}))
check('each level keeps its own open branch', eq(toggleBranch({ '': 'rows' }, 'rows', 'fill'), { '': 'rows', rows: 'fill' }))
const tree = decorateTree([{ key: 'rows', children: [{ key: 'fill' }, { key: 'text' }] }, { key: 'card' }], { '': 'rows', rows: 'fill' })
check('open is filled in at every level', tree[0].open && !tree[1].open && tree[0].children[0].open && !tree[0].children[1].open)
check('depth and parent travel down', tree[0].children[1].depth === 1 && tree[0].children[1].parentKey === 'rows')
check('a leaf has no children list', tree[1].children === null)

const failed = results.filter(([, cond]) => !cond)
console.log(failed.length ? `\n${failed.length} failed` : '\nall passed')
process.exit(failed.length ? 1 : 0)
