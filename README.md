# @xeplr/ui-utils

**The small shared UI pieces the xeplr apps and packages use.** It has form controls (dropdown, text, number, date, date range, from/to range), file upload and data import, import history, a searchable tile grid, and a progress notifier driven by server events. It also has imperative helpers that need no mount point (`raiseSnackbar`, `raiseConfirm`, `raiseChoice`), the default design theme that `@xeplr/ui-charts` and `@xeplr/ui-table` resolve against, and static country and state lists. Every control is split into a pure **model**, a **controller** hook and a replaceable **design**. A ready-made `*Page` component joins the three together.

(The package name on npm is `@xeplr/ui-utils`. The GitHub repo and folder are named `xeplr-ui-utils`.)

## Install

```sh
npm i @xeplr/ui-utils @xeplr/ui-table @tanstack/react-table
```

Peer dependencies: `react ^18 || ^19` and [`@xeplr/ui-table`](https://www.npmjs.com/package/@xeplr/ui-table), whose own peer is `@tanstack/react-table ^8`. `ImportHistoryPage` draws its table with `XeplrTable`. `src/index.js` imports that design statically, so importing anything from `@xeplr/ui-utils` requires `@xeplr/ui-table` to be installed.

The package ships its source (`main: src/index.js`), so your bundler must handle:

- **JSX** from `node_modules`;
- **CSS imports**, because each design imports its own stylesheet (for example `dropdown.css`), so you never import CSS yourself;
- **JSON imports** (`countries.json`, `states.json`, `default.theme.json`).

Vite does all three.

## Quick start

From `xeplr-bi`'s company picker:

```jsx
import { useState } from 'react'
import { DropdownPage, raiseSnackbar } from '@xeplr/ui-utils'

export default function SelectCompany() {
  const [company, setCompany] = useState(null)
  return (
    <DropdownPage
      fetchData={listCompanies}                     // () => Promise<[{ id, name }]>
      onCreate={createCompany}                      // (name) => Promise<created item or its id>
      keys={['id', 'name']}
      value={company ? company.id : null}
      onChange={(id, items) => {
        setCompany(items[0] || null)
        if (items[0]) raiseSnackbar('Switched to ' + items[0].name, { design: 'success' })
      }}
      placeholder="Select company"
      createLabel="Add company"
    />
  )
}
```

## Three ways to use it

1. **Ready-made.** `DropdownPage`, `DateRangePage`, `RangeFieldPage`, `DateFieldPage`, `NumberFieldPage`, `TextFieldPage`, `FileUploadPage`, `DataImportPage`, `ImportHistoryPage`, `GridDisplayerPage`, and also `ProgressNotifier`. Each page is `controller(props)` → `<Sample {...controller} />`, wrapped in a `<div>` that checks the design against its rules.
2. **Your own design.** Call `use*Controller(props)` and draw the returned state and handlers however you like. To keep the development-time check, put `useDesignValidator(name, *_RULES)`'s ref on your wrapper (see [Design rules](#design-rules)).

   ```jsx
   import { useDropdownController, useDesignValidator, DROPDOWN_RULES } from '@xeplr/ui-utils'

   function CompanyPicker(props) {
     const c = useDropdownController(props)
     const ref = useDesignValidator('CompanyPicker', DROPDOWN_RULES)
     return (
       <div ref={ref}>
         <div ref={c.rootRef} className="xeplr-dropdown">
           <button role="combobox" onClick={c.toggle}>{c.selectedItems[0]?.name || c.placeholder}</button>
           {/* always mounted: the rules are checked once, at mount, while the panel is closed */}
           <ul role="listbox" hidden={!c.isOpen}>
             {c.filteredItems.map((it) => (
               <li key={it.id} onClick={() => c.selectItem(it.id)}>{it.name}</li>
             ))}
           </ul>
         </div>
       </div>
     )
   }
   ```

3. **Model only.** The model files import neither React nor the DOM: `dateRange.js`, `rangeField.js`, `textField.js`, `numberField.js`, `dateField.js`, `dropdown.js`, `gridDisplayer.js`, `dataImport.js`, and `theme/index.js`. They are exported from the root (for a bundler). In plain Node, import the file directly, because the root index pulls in JSX, CSS and JSON. The tests do this:

   ```js
   import { resolveDateValue } from '@xeplr/ui-utils/src/dateRange/dateRange.js'
   resolveDateValue({ kind: 'quick', preset: 'last_month' }, new Date(2026, 6, 29))
   // → { from: '2026-06-01', to: '2026-06-30' }
   ```

   `theme/index.js` imports its JSON with `with { type: 'json' }`, which needs a Node version that supports import attributes. CI uses Node 24.

## Exports

### Pages and components

| export | props | what it is |
|---|---|---|
| `DropdownPage` | [see below](#dropdownpage) | Single or multi select over static or fetched items, with search and optional create |
| `DateRangePage` | [see below](#daterangepage) | Quick preset / Range / Single tabs, all resolving to `{ from, to }` |
| `RangeFieldPage` | [see below](#rangefieldpage) | A From and a To date input drawn as one field, each bounded by the other |
| `DateFieldPage` | [see below](#datefieldpage) | Date, datetime, or date of birth with the age computed |
| `NumberFieldPage` | [see below](#numberfieldpage) | Float, currency or units input with an affix picker |
| `TextFieldPage` | [see below](#textfieldpage) | Text, multiline or search input, themed by `--xeplr-input-text-*` |
| `FileUploadPage` | [see below](#fileuploadpage) | Drag-and-drop upload with type and size checks and a progress bar |
| `DataImportPage` | [see below](#dataimportpage) | Upload a file, map its parts to targets, commit |
| `ImportHistoryPage` | [see below](#importhistorypage) | Past imports in a `XeplrTable`, with Rollback and Delete |
| `GridDisplayerPage` | [see below](#griddisplayerpage) | Searchable, sortable grid of tiles you render |
| `ProgressNotifier` | [see below](#progressnotifier) | Indeterminate bar and a line of text for one event key |
| `FileUploadSample`, `DataImportSample`, `ImportHistorySample`, `NumberFieldSample`, `DateFieldSample`, `DateRangeSample`, `RangeFieldSample`, `DropdownSample`, `GridDisplayerSample`, `TextFieldSample` | the matching controller's return value | The default designs, usable on their own |

### Controllers (hooks)

| hook | takes | returns |
|---|---|---|
| `useDropdownController(props)` | DropdownPage props | `mode, source, keys {id,name,extras}, searchable, canCreate, createLabel, creating, createError, createItem(name?), placeholder, disabled, items, filteredItems, selectedItems, selection, loading, error, query, isOpen, rootRef, isSelected(id), open, close, toggle, selectItem(id), removeSelection(id), clearSelection, handleSearch(e), refresh` |
| `useDateRangeController(props)` | DateRangePage props | `tab, setTab, presets, value, label, range, single, setSingle, singleParsed, suggestions, applySuggestion(text), selectPreset(key), setRangeFrom, setRangeTo, commitSingle(close), clear, allowClear, inheritedLabel` |
| `useRangeFieldController(props)` | RangeFieldPage props | `fromLabel, toLabel, from, to`. `from` and `to` are each a `useDateFieldController` result. |
| `useDateFieldController(props)` | DateFieldPage props | `type, inputType, raw, age, error, placeholder, disabled, min, max, handleChange` |
| `useNumberFieldController(props)` | NumberFieldPage props | `type, raw, numeric, error, placeholder, disabled, decimals, formatDisplay, affix {list, selected, position, labelKey, valueKey} \| null, handleNumberChange, handleAffixChange, handleBlur` |
| `useTextFieldController(props)` | TextFieldPage props | `type, raw, error, remaining, placeholder, disabled, required, maxLength, rows, label, help, handleChange, handleBlur, handleKeyDown, handleClear` |
| `useFileUploadController(options)` | FileUploadPage props | `files, uploading, progress, error, result, dragOver, inputRef, handleChange, handleDragOver, handleDragLeave, handleDrop, handleUpload, openFilePicker, removeFile(i), clear, allowedTypes, maxSize, maxFiles` |
| `useDataImportController(options)` | DataImportPage props | `file, inspecting, inspected, mappings, committing, results, error, handleFileChange, updateMapping(i, patch), handleCommit, reset, accept, targetLabel` |
| `useImportHistoryController(options)` | ImportHistoryPage props | `jobs, loading, error, rollingBackId, deletingId, reload, handleRollback(job), handleDelete(job)` |
| `useGridDisplayerController(props)` | GridDisplayerPage props | `query, setQuery, sortFields, sortValue, setSortValue, displayRows, tileFormatComponent, onSelect, onAddNew` |
| `useDesignValidator(name, rules)` | page name, rule list | a ref for the design's container |

### Model functions (no React)

| export | signature | what it does |
|---|---|---|
| `QUICK_PRESETS` | `[{ key, label }]` | 17 presets: `today`, `yesterday`, `dby`, `last_7_days`, `last_30_days`, `current_month`, `current_mtd`, `last_month`, `current_quarter`, `current_qtd`, `last_quarter`, `current_calendar_year`, `current_ytd`, `last_calendar_year`, `current_financial_year`, `current_fytd`, `last_financial_year` |
| `resolveQuickPreset` | `(preset, now, { fiscalStartMonth = 4 }?) → { from, to } \| null` | Resolves a preset against `now`. Unknown presets give `null`. |
| `parseSingleDate` | `(text) → { from, to } \| null` | Accepts `2022`, `2022-05`, `2022-05-17`, `May 2022` / `may 2022` / `Feb 2022`, and `17/5/2022` (day first) |
| `resolveDateValue` | `(selection, now?, options?) → { from, to } \| null` | Resolves a `quick` / `range` / `single` selection. `null` means no constraint. |
| `dateValueLabel` | `(selection) → string \| null` | "Last month", "2022-01-01 → 2022-03-31", "From …", "Until …" |
| `dateValueIsSet` | `(selection, now?) → boolean` | True only if the selection resolves to a range |
| `RANGE_TYPES`, `emptyRange`, `normalizeRange`, `rangeIsSet` | `['date','datetime']`, `() → {from:'',to:''}`, `(r) → {from,to}`, `(r) → boolean` | From/to helpers. A range with one side set counts as set. |
| `DATE_TYPES`, `isValidISODate`, `calculateAge`, `inputTypeFor`, `toInputValue`, `validateBounds` | `['date','datetime','age']`, `(s)`, `(dob, now?)`, `(type)`, `(value, type)`, `(value, min, max) → { valid, error? }` | Date field helpers |
| `NUMBER_TYPES`, `sanitizeNumberInput`, `toNumeric`, `formatDisplay`, `validateRange`, `resolveAffixState` | `['float','currency','units']`, `(raw)`, `(raw) → number \| null`, `(value, decimals?)`, `(value, min, max) → { valid, error? }`, `(type, options)` | Number field helpers. `sanitizeNumberInput` keeps digits, the first `.`, and a leading `-`. |
| `TEXT_TYPES`, `toValue`, `normalise`, `validate`, `remaining` | `['text','multiline','search']`, `(raw) → string`, `(raw, { trim, maxLength })`, `(raw, { required, requiredMessage, minLength, maxLength, pattern, patternMessage }) → string \| null`, `(raw, maxLength) → number \| null` | Text field helpers |
| `DROPDOWN_MODES`, `normalizeKeys`, `sortByKey`, `filterByQuery`, `pickSelected` | `['single','multi']`, `(keys) → { id, name, extras }`, `(items, key)`, `(items, query, searchKeys)`, `(items, ids, idKey)` | Dropdown helpers |
| `filterGridRows`, `sortGridRows` | `(rows, query, fields)`, `(rows, field, 'asc'\|'desc')` | Grid search and sort. An array field matches if any entry matches. |
| `sanitizeTargetName`, `buildInitialMappings` | `(name) → string`, `({ parts?, originalName? }) → [{ part, target, include }]` | Data import mapping |
| `configureUpload`, `uploadFile` | `({ url, headers, getHeaders })`, `(files, { url, fieldName, extraData, onProgress }) → Promise` | Multipart upload over XHR |
| `attachProgressSource`, `progressSourceAttached`, `subscribeToProgress`, `describeProgress`, `describeComplete` | `(subscribe)`, `() → boolean`, `(key, handler) → unsubscribe`, `(data, noun?)`, `(data, noun?)` | The progress event source and its sentences |

### Imperative helpers, theme, data

| export | signature | what it does |
|---|---|---|
| `raiseSnackbar` | `(message, { design: 'success'\|'error'\|'default', duration = 3000 }?)` | Toast in the bottom-right corner. Click to dismiss. |
| `raiseConfirm` | `(message, { title, confirmLabel, cancelLabel, danger }?) → Promise<boolean>` | Yes/no modal dialog |
| `raiseChoice` | `(message, { title, choices: [{ value, label, style?, isDefault? }], dismissValue = null }) → Promise<value>` | Modal dialog with any number of answers |
| `DEFAULT_THEME` | object | `default.theme.json`: `{ name, default: 'light', font, themes: { light, dark } }`. Each variant has `chart`, `table` and `input: { text, select, number, date }`. |
| `resolveTheme` | `(overrides?) → theme` | `deepMerge(DEFAULT_THEME, overrides)` |
| `getThemeVariant` | `(name, overrides?) → { chart, table, input }` | One variant. An unknown name falls back to `default`. |
| `getChartOptions` | `(variantName, overrides?) → ChartOptions` | The variant's `chart` section plus `fontFamily` |
| `inputStyleVars` | `(control, overrides?, variantName?) → { '--xeplr-input-<control>-…': value }` | Theme values as CSS custom properties for one control |
| `deepMerge` | `(base, override)` | Immutable merge. Arrays are replaced, and `undefined` never overwrites a value. |
| `COUNTRIES` | `[{ code, name }]` | 196 countries |
| `STATES`, `STATES_IN` | `{ IN: [{ code, name }] }`, `[{ code, name }]` | 36 Indian states and union territories |
| `FILE_UPLOAD_RULES`, `DATA_IMPORT_RULES`, `IMPORT_HISTORY_RULES`, `NUMBER_FIELD_RULES`, `DATE_FIELD_RULES`, `DATE_RANGE_RULES`, `RANGE_FIELD_RULES`, `DROPDOWN_RULES`, `GRID_DISPLAYER_RULES`, `TEXT_FIELD_RULES` | rule arrays | What each page requires of a design |

## DropdownPage

| prop | type | default | meaning |
|---|---|---|---|
| `mode` | `'single' \| 'multi'` | `'single'` | Any other value throws |
| `options` | `Array` | — | Static items. Used when `fetchData` is absent. |
| `fetchData` | `() => Promise<Array>` | — | Loads items **once, on mount** (see `refresh` on the controller) |
| `keys` | `string[]` | `['id', 'name']` | `[idKey, nameKey, ...extraKeys]`. Extras are shown under the name and are searchable. |
| `value` | `id \| id[] \| null` | — | Controlled selection |
| `defaultValue` | `id \| id[]` | — | Uncontrolled initial selection |
| `onChange` | `(value, items) => void` | — | Single mode gets `id \| null`, multi mode gets `id[]`. `items` are the selected item objects. |
| `placeholder` | `string` | `'Select…'` | |
| `searchable` | `boolean` | `true` | Search box in the panel |
| `disabled` | `boolean` | `false` | |
| `onCreate` | `(name) => Promise<item \| id>` | — | Enables an "Add “typed text”" row |
| `allowCreate` | `boolean` | `true` | Set `false` to hide the create row even when `onCreate` is given |
| `createLabel` | `string` | `'Add'` | Prefix of the create row, for example `'Add company'` |

- Items are sorted by the name key, ignoring case. Search matches the name and extra keys as a substring, also ignoring case.
- The create row appears only when there is typed text and no item's name matches it exactly. After `onCreate`, fetched items are loaded again so the new row has its real server id. The new item is then selected, found by the returned object's id, a returned scalar, or failing both a name match.
- Clicking outside closes the panel. Picking in single mode closes it too. Multi mode shows chips with × buttons.
- In single mode an id of `0` is sent as `null`, because the code uses `selection[0] || null`.

## DateRangePage

```jsx
<DateRangePage value={value} onChange={setValue} onClose={close} allowClear={false} inheritedLabel="Last month" />
```

| prop | type | default | meaning |
|---|---|---|---|
| `value` | `{ kind: 'quick', preset } \| { kind: 'range', from, to } \| { kind: 'single', value } \| null` | `null` | The selection |
| `onChange` | `(selection \| null) => void` | no-op | |
| `onClose` | `() => void` | — | Called after a choice that ends the interaction: a preset, a suggestion, Enter in Single, or Clear |
| `presets` | `[{ key, label }]` | `QUICK_PRESETS` | The Quick list. Only keys that `resolveQuickPreset` knows will resolve. |
| `allowClear` | `boolean` | `true` | `false` removes the Clear button, and `clear()` refuses too |
| `inheritedLabel` | `string` | — | Shows "Using …" when `value` is empty |

**Every selection resolves to `{ from, to }`, including a single date.** "May 2022" becomes 1–31 May and "2022" becomes the whole year, so a consumer never has to ask which comparison was meant. The Range tab changes `onChange` on every edit, and one open side is allowed. The Single tab commits only once the text parses ("Not a date yet" otherwise), on blur or Enter. While you type, it suggests months and years, putting the committed year first. The financial-year presets use `fiscalStartMonth` (default April). The page itself does not pass that option, so change it by calling `resolveDateValue(value, now, { fiscalStartMonth })` where you consume the value.

## RangeFieldPage

| prop | type | default | meaning |
|---|---|---|---|
| `type` | `'date' \| 'datetime'` | `'date'` | |
| `value` | `{ from, to }` | `{ from: '', to: '' }` | **Controlled only.** Each side shows `value`, so update it in `onChange`. |
| `onChange` | `({ from, to }) => void` | — | A cleared side is `''` |
| `min`, `max` | `Date \| string` | — | Floor for From, ceiling for To |
| `disabled` | `boolean` | — | |
| `fromLabel`, `toLabel` | `string` | `'From'`, `'To'` | |
| `fromPlaceholder`, `toPlaceholder` | `string` | — | For example `toPlaceholder="Now"` for an open end |

From's `max` is `to` (or `max`) and To's `min` is `from` (or `min`), so neither side can cross the other. This is not `DateRangePage`: it has no presets and no popover. Use it for a form section that just needs the two inputs.

## DateFieldPage

| prop | type | default | meaning |
|---|---|---|---|
| `type` | `'date' \| 'datetime' \| 'age'` | `'date'` | Any other value throws. `age` is a date of birth input with "Age N yrs" shown beside it. |
| `value` / `defaultValue` | `Date \| string \| null` | — | Controlled / uncontrolled |
| `onChange` | `(value \| null, meta) => void` | — | `value` is the input's string (`YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` for datetime). For `age`, `meta.age` holds the age. |
| `min`, `max` | `Date \| string` | — | Passed to the input. Out of range shows "Date is before minimum" / "Date is after maximum". |
| `placeholder`, `disabled` | | | |

## NumberFieldPage

| prop | type | default | meaning |
|---|---|---|---|
| `type` | `'float' \| 'currency' \| 'units'` | `'float'` | Any other value throws |
| `value` / `defaultValue` | `number \| null` | — | Controlled / uncontrolled |
| `onChange` | `(number \| null, { affix }) => void` | — | Empty, or a lone `-`, gives `null` |
| `currencies` | `[{ code, symbol }]` | — | **Required** for `currency` (throws otherwise) |
| `defaultCurrency`, `currencyPosition` | `string`, `'before' \| 'after'` | first, `'before'` | |
| `units` | `[{ value, label }]` | — | **Required** for `units` (throws otherwise) |
| `defaultUnit`, `unitPosition` | `string`, `'before' \| 'after'` | first, `'after'` | |
| `min`, `max` | `number` | — | Out of range shows "Value must be at least / at most …". The value is still sent. |
| `decimals` | `number` | — | On blur, an uncontrolled field is rewritten to this many decimals |
| `placeholder`, `disabled` | | | |

The input is `type="text" inputMode="decimal"`. Typing is sanitised. An affix list with one entry is shown as static text, and a longer one as a select.

## TextFieldPage

| prop | type | default | meaning |
|---|---|---|---|
| `type` | `'text' \| 'multiline' \| 'search'` | `'text'` | Any other value throws |
| `value` / `defaultValue` | `string` | — | Controlled / uncontrolled. `null` and `undefined` become `''`. |
| `onChange` | `(value) => void` | — | Every keystroke |
| `onCommit` | `(value) => void` | — | On blur, or Enter in a single-line field, after `trim` / `maxLength` are applied |
| `onCancel` | `() => void` | — | Escape in a single-line field |
| `required`, `requiredMessage` | `boolean`, `string` | —, `'This is required'` | |
| `minLength`, `maxLength` | `number` | — | `maxLength` caps the text as you type |
| `pattern`, `patternMessage` | `RegExp \| string`, `string` | —, `'That is not a valid value'` | |
| `trim` | `boolean` | `false` | Trim when committing |
| `label`, `help` | `string` | — | An error replaces the help text |
| `rows` | `number` | `4` | Multiline only |
| `placeholder`, `disabled` | | | |

The search type shows a ✕ only when there is text, and clearing calls `onChange('')` and `onCommit('')`. The "N left" counter appears only near the limit, at `max(10, 10% of maxLength)` characters or fewer. Without `onCommit`, a commit that changes the text (by trimming) calls `onChange` instead.

## FileUploadPage

```jsx
import { configureUpload, FileUploadPage } from '@xeplr/ui-utils'

configureUpload({ url: '/uploads', getHeaders: () => ({ Authorization: 'Bearer ' + getToken() }) })

<FileUploadPage allowedTypes={['image/*', 'application/pdf']} maxSize={10 * 1024 * 1024} maxFiles={3}
  onSuccess={(res) => raiseSnackbar('Uploaded', { design: 'success' })} />
```

| prop | type | default | meaning |
|---|---|---|---|
| `allowedTypes` | `string[]` | `['*']` | Exact MIME types, or `type/*` |
| `maxSize` | `number` (bytes) | 5 MB | Per file |
| `maxFiles` | `number` | `1` | |
| `url` | `string` | the `configureUpload` URL | Per-page override |
| `fieldName` | `string` | `'file'` | Form field each file is appended under |
| `extraData` | `object` | — | Extra form fields |
| `onSuccess` / `onError` | `(response)` / `(error)` | — | |

`uploadFile` POSTs `multipart/form-data` with `XMLHttpRequest`, so it can report upload progress. The default URL is `/internal/upload`. `getHeaders()`, if set, is called on **every** upload, so headers such as an auth token are always current. Otherwise the static `headers` are used. The response must be JSON. A non-2xx response rejects with the response's `error` or "Upload failed". If any picked file breaks a rule, the whole selection is rejected with a message naming that file.

## DataImportPage

| prop | type | meaning |
|---|---|---|
| `onInspect` | `(filePath, file) => Promise<{ format, parts? }>` | **Required.** Say what an uploaded file contains. `parts` holds, for example, an Excel workbook's sheet names. |
| `onCommit` | `(filePath, [{ part, target }], { originalName }) => Promise<{ results } \| results[]>` | **Required.** Load the included parts into their targets. |
| `accept` | `string` | The file input's `accept` attribute, for example `'.csv,.json,.xlsx,.xls'` |
| `targetLabel` | `string` | Placeholder for the target name (default `'Target'`) |

The file is sent through this package's own `uploadFile()` to the URL set by `configureUpload`, not through a prop. That keeps the component free of app-specific upload wiring. The apps point it at `@xeplr/base-apis`' generic upload route. The upload response must include `filePath`. With `parts`, each part becomes a row (included by default) whose target is `sanitizeTargetName(part)`. Without `parts`, there is one row named after the file. Result rows show `target (part)` and then `rows` + " rows", "Done", or `error`, depending on `success`.

`sanitizeTargetName('Sales 2024.xlsx')` returns `'sales_2024'`. It lowercases, drops the extension, turns runs of non-`[a-z0-9_]` characters into `_`, trims `_` from both ends, and falls back to `'table'`.

## ImportHistoryPage

| prop | type | meaning |
|---|---|---|
| `onList` | `() => Promise<{ jobs } \| jobs[]>` | **Required, and must be a stable function**: module-level, or wrapped in `useCallback`. The list reloads whenever its identity changes. |
| `onRollback` | `(job) => Promise` | Rollback of a `completed` job. The list reloads afterwards. |
| `onDelete` | `(job) => Promise` | Removes a history record. The Delete button is on every row, so without this prop it fails with an error. |

Job shape: `{ id, originalFileName, part, target, rows, status: 'completed' | 'failed' | 'rolled-back', startedAt, error, destination?, rowsLoaded?, rowsDropped?, createdByName? }`. Missing optional fields show "—". Both actions ask first with `raiseConfirm` (danger style). The Delete prompt warns that deleting a completed job's record does **not** undo its data and makes it impossible to roll back. The table shows 20 rows per page.

## GridDisplayerPage

```jsx
function Tile({ row, isAddTile }) {
  return isAddTile ? <span>＋ New</span> : <strong>{row.name}</strong>
}

<GridDisplayerPage rows={dashboards} tileFormatComponent={Tile} searchFields={['name', 'tags']}
  sortFields={[{ value: 'name_asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
               { value: 'updated_desc', label: 'Newest', field: 'updatedAt', direction: 'desc' }]}
  onSelect={open} onAddNew={create} />
```

| prop | type | default | meaning |
|---|---|---|---|
| `rows` | `object[]` | `[]` | Tiles are keyed by `row.id` |
| `tileFormatComponent` | component | — | **Required.** Renders only the tile's content: `{ row }`, or `{ isAddTile: true }` for the leading add tile. |
| `searchFields` | `string[]` | `['name']` | |
| `sortFields` | `[{ value, label, field, direction }]` | Name (A-Z) | Each entry is one option in a single sort dropdown |
| `onSelect` | `(row) => void` | — | Tile click |
| `onAddNew` | `() => void` | — | If given, a leading add tile is shown |

## ProgressNotifier

Attach your app's event stream **once** at startup, then mount notifiers anywhere with a key. From `xeplr-bi`:

```js
import { attachProgressSource } from '@xeplr/ui-utils'

attachProgressSource((handler) => subscribeToRunEvents((evt) => {
  if (evt.type === 'progress') handler({ key: evt.subjectId, continue: true, data: evt.progress || {} })
  if (evt.type === 'complete') handler({ key: evt.subjectId, continue: false, data: evt })
  if (evt.type === 'error')    handler({ key: evt.subjectId, continue: false, status: 'error', data: { error: evt.error } })
}))   // subscribeToRunEvents returns its unsubscribe function
```

```jsx
<ProgressNotifier eventKey={cubeId} noun="tables" onComplete={() => measure(cubeId)} />
```

| prop | type | default | meaning |
|---|---|---|---|
| `eventKey` | `string` | — | Listens for events with this `key` |
| `noun` | `string` | — | Used in fallback text: "Working on the tables…" |
| `idle` | node | `null` | Rendered before any event arrives |
| `keepFinal` | `boolean` | `false` | Keep the finished line instead of clearing it |
| `finalMs` | `number` | `4000` | How long the finished line stays |
| `onComplete` / `onError` | `(data) => void` | — | |
| `className` | `string` | `''` | |

Event contract: `{ key, continue: true | false, status?, data }`. `continue: false` (or `status: 'complete'`) means finished, and `status: 'error'` means it failed. Anything else, including an event with no `continue` at all, counts as still running. Being wrong that way leaves a bar moving until the next event. Being wrong the other way would hide work that is still going. The text comes from `data`:

- While running: `data.message` wins; otherwise the counters `rowsRead`, `rowsLoaded`, `rowsScanned`, `groupCount`, `batches` and `cubeRows`; otherwise "Working on the {noun}…".
- When finished: `data.message`, or "Finished — N rows in 1.2s", from `cubeRows`, `rowsLoaded` or `groupCount` plus `durationMs`.
- On error: `data.error`, or `data.message`, stays on screen.

With no source attached, every notifier renders `idle` and nothing else.

## raiseSnackbar, raiseConfirm, raiseChoice

```js
raiseSnackbar('Saved', { design: 'success' })

if (await raiseConfirm('This deletes every row loaded by this import.', { title: 'Rollback this import?', confirmLabel: 'Rollback', danger: true })) { … }

const answer = await raiseChoice('You have unsaved changes.', {
  title: 'Leave this page?',
  choices: [
    { value: 'stay', label: 'Stay' },
    { value: 'discard', label: 'Leave without saving', style: 'danger' },
    { value: 'save', label: 'Save and leave', style: 'primary', isDefault: true }
  ]
})   // null if dismissed
```

These create their own DOM nodes with inline styles, so they need no provider, mount point or CSS import. The snackbar stacks in the bottom-right corner and dismisses itself after `duration` or on click. A dialog focuses its **last** button. Escape or a click on the overlay resolves to the dismiss value: `false` for `raiseConfirm`, `dismissValue` (default `null`) for `raiseChoice`.

## Design rules

`useDesignValidator(name, rules)` returns a ref. After mount it checks, **once**, that the container has each required element. A rule is `{ id | role | selector | anyOf: [selectors], label }`. For every rule that fails it logs `[xeplr-ui-utils] <name> design is missing required elements: …` with `console.error`, and it sets `data-xeplr-design-invalid="<name>"` and a `title` on the container.

| rules | require |
|---|---|
| `DROPDOWN_RULES` | `.xeplr-dropdown-trigger` or `[role="combobox"]`; `.xeplr-dropdown-panel` or `[role="listbox"]` |
| `DATE_RANGE_RULES` | tab buttons (`.xeplr-daterange-tabs button` or `[data-xeplr-daterange-tab]`); **any one of** a preset button or a date input |
| `RANGE_FIELD_RULES` | `.xeplr-rangefield-field` |
| `DATE_FIELD_RULES` | `input[type="date"]`, `input[type="datetime-local"]` or `.xeplr-datefield-input` |
| `NUMBER_FIELD_RULES` | `input[inputmode="decimal"]` or `input.xeplr-numberfield-input` |
| `TEXT_FIELD_RULES` | a text or search input, a `textarea`, or `.xeplr-textfield-input` |
| `FILE_UPLOAD_RULES` | `input[type="file"]`; `.xeplr-upload-dropzone` or `[role="dropzone"]`; a `button` |
| `DATA_IMPORT_RULES` | `input[type="file"]` |
| `GRID_DISPLAYER_RULES` | `.xeplr-grid-search`; `.xeplr-grid` |
| `IMPORT_HISTORY_RULES` | nothing |

## Theming

The designs use `xeplr-*` class prefixes (`xeplr-dropdown-*`, `xeplr-daterange-*`, `xeplr-rangefield-*`, `xeplr-datefield-*`, `xeplr-numberfield-*`, `xeplr-textfield-*`, `xeplr-upload-*`, `xeplr-data-import-*`, `xeplr-import-history-*`, `xeplr-grid-*`). The progress notifier uses `xpn`, `xpn--running` / `--complete` / `--error`, `xpn-bar` and `xpn-text`. What each design reads:

| design | reads | without it |
|---|---|---|
| Dropdown, DataImport, ImportHistory, GridDisplayer | `@xeplr/ui-account` theme tokens: `--xeplr-bg-*`, `--xeplr-text-*`, `--xeplr-border-*`, `--xeplr-input-bg/-border/-text/-placeholder`, `--xeplr-accent`, `--xeplr-accent-text`, `--xeplr-danger*`, `--xeplr-success`, `--xeplr-tag-*`, `--xeplr-shadow-lg` | dark fallbacks |
| Snackbar, confirm dialogs | `--xeplr-success`, `--xeplr-danger`, `--xeplr-accent`, `--xeplr-accent-text`, `--xeplr-bg-overlay`, `--xeplr-bg-secondary/-tertiary`, `--xeplr-text-primary/-secondary`, `--xeplr-border-primary`, `--xeplr-shadow-lg` | the snackbar's original colours; a dark dialog |
| DateRange, RangeField, ProgressNotifier | `--xeplr-surface`, `--xeplr-surface-2`, `--xeplr-border`, `--xeplr-border-strong`, `--xeplr-border-secondary`, `--xeplr-muted`, `--xeplr-muted-2`, `--xeplr-text`, `--xeplr-hover`, `--xeplr-accent`, `--xeplr-danger`, `--xeplr-success` | light fallbacks. Of these, `ui-account`'s `theme.css` defines only accent, danger, success and border-secondary. |
| TextField | `--xeplr-input-text-*` (gap, padding, bg, colour, font size, placeholder, each border edge, border colour/hover/focus, radius, the full label font, help text, focus ring, invalid) | shipped defaults |
| NumberField, DateField (and so RangeField's two inputs), FileUpload | fixed dark colours, no variables | — |

`@xeplr/ui-account`'s `ThemeProvider` puts the class `xeplr-theme-{dark|light|medium|bright}` on a wrapper `div`, and its `src/designs/theme.css` defines the tokens for those classes. Load that stylesheet and wrap the app to theme the first two rows.

To theme TextField, spread `inputStyleVars` on an ancestor:

```jsx
<div style={inputStyleVars('text', { themes: { light: { input: { text: {
  border: { top: false, right: false, left: false, bottom: true, radius: '0' }   // bottom rule only
} } } } })}>
  <TextFieldPage label="Name" required trim />
</div>
```

An edge set to `false` becomes `0` instead of being left out, because a missing variable would fall back to the stylesheet's default and bring the border back. `inputStyleVars` also produces `select`, `number` and `date` variables, but no stylesheet in this package reads them yet.

## Rules the code enforces

- **Unresolvable dates widen, never empty.** `resolveDateValue` returns `null` ("no constraint") for anything it cannot resolve, so a bad selection does not quietly turn a report empty. `dateValueIsSet` means *resolves*, not *has text*: unparseable text has a label but no range, and treating it as set would pass a "do we have a default?" check and then filter nothing.
- **Presets over literal dates.** A preset resolves against `now`, so a saved report stays current. `last_7_days` includes today. The financial year starts in April unless you pass `fiscalStartMonth`, because hard-coding one month makes reports show the wrong year in most of the world.
- **Slash dates are day first.** `1/2/2022` is 1 February.
- **A partial Single entry is never committed.** "May 202" must not overwrite a good selection with nothing. Picking a suggestion commits at once, because a pick is already a decision.
- **`allowClear={false}` is enforced in `clear()`**, not just by hiding the button. A custom design cannot produce an empty selection that the host said it cannot accept.
- **Design problems are reported, not thrown.** Throwing from an effect gives React nothing to catch, so a development-time check would crash the whole app. `DATE_RANGE_RULES` uses `anyOf` because a tabbed design mounts one tab at a time. Requiring a preset list *and* a date input at the same time could never pass.
- **Text errors appear on commit, not on each keystroke.** Complaining that a required field is empty while the first letter is being typed is shouting at someone who hasn't finished. `maxLength` caps input as you type, because a limit you can exceed and only hear about afterwards does nothing. Trimming is opt-in, because `" "` is a valid search and a mistake in a name.
- **Text values are never `undefined`.** `toValue` turns `null`/`undefined` into `''`, because a controlled input handed `undefined` becomes uncontrolled and React warns.
- **One dialog at a time.** Opening a dialog resolves any open one with its dismiss value. Otherwise a second overlay and a second key listener would stack over the first. Enter picks only a button marked `isDefault`. With three answers there is no obvious one to guess, and a guess could save or discard someone's work on a stray key press.
- **ProgressNotifier subscribes by key only.** Its callbacks live in a ref. When inline callbacks were dependencies, each host render tore down the subscription and rebuilt it, opening a new stream and using up a single-use ticket each time. The bar is indeterminate on purpose: work like a `GROUP BY` cannot say how far along it is, and a percentage would be made up. Errors stay on screen. A finished line clears after `finalMs`, because a line that never clears still looks current an hour later.
- **Uploads go through one configured route.** `DataImportPage` calls `uploadFile()` instead of taking an upload prop, so the component stays independent of any app. Only "what is in the file" and "where does it go" are app-specific.
- **Theme overrides replace arrays.** An override palette replaces the default instead of blending with it index by index.

## Files

```
src/
  index.js                ─ everything below
  <control>/              ─ dropdown, dateRange, rangeField, dateField, numberField, textField,
                            fileUpload, dataImport, gridDisplayer — each has:
    <control>.js            model (pure; dataImport.js, uploadFile.js)
    use*Controller.js       controller
    validateDesign.js       *_RULES (fileUpload's also defines useDesignValidator)
    designs/                *Sample.jsx + its .css
    pages.jsx               *Page = controller + design + validator
  progress/               ─ progressSource.js (model), ProgressNotifier.jsx, designs/progressNotifier.css
  snackbar/snackbar.js    ─ raiseSnackbar
  confirm/confirm.js      ─ raiseConfirm, raiseChoice
  theme/                  ─ default.theme.json, index.js (resolveTheme, getThemeVariant, getChartOptions, inputStyleVars, deepMerge)
  data/                   ─ countries.json, states.json
test/                     ─ dateRange, rangeField, textField (+ inputStyleVars), validateDesign (DATE_RANGE_RULES)
```

## Tests

```sh
npm test
```

This runs each `test/*.test.js` with plain `node` and stops at the first failing file. The tests cover the date range model, the range field model, the text field model with `inputStyleVars`, and the date range design rules. CI runs the same files with `node --test` and coverage.

## License

MIT
