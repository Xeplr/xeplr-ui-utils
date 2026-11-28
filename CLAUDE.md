# @xeplr/ui-utils — map

Shared React form controls, the import screen, upload/sign-in plumbing, URL state, dialogs and the
default theme for every xeplr UI (BI, X-Flow, ui-jobs, generated apps). Plain ESM source, no build
(`main: src/index.js`). Not an app and not a router: it never knows about logins beyond `configureUpload`.
API details: see README → Exports and each `## <Name>Page` section.

## Where things are
Every feature folder is MVC: model `src/<f>/<f>.js` (pure) · controller `src/<f>/use*Controller.js` ·
design `src/<f>/designs/*Sample.jsx` + `.css`, re-exported by `designs/index.js` · rules
`src/<f>/validateDesign.js` (`*_RULES`) · page `src/<f>/pages.jsx` (controller + Sample + validator).
- `src/index.js` — the only public entry; every export below goes through it (except `url/`).
- **fileUpload** — `uploadFile.js`: `configureUpload({url, headers|getHeaders, renew})`, `uploadFile()` (XHR + progress),
  `uploadHeaders()`, `signedFetch()`, `renewSignIn()`, `renewAndRetry()` · `useFileUploadController.js` ·
  `designs/FileUploadSample.jsx` · `validateDesign.js` → `useDesignValidator()` + `FILE_UPLOAD_RULES` · `pages.jsx` → `FileUploadPage`.
- **designCheck** — `designCheck.js`: `missingFrom()`, `ruleSelectors()`, `ruleApplies()` (`when(state)`), `ruleLabel()` ·
  `useDesignCheck.js`: the BLOCKING check (`{ref, missing}`; page renders an error instead of the design).
- **dataImport** — `dataImport.js`: `buildInitialMappings()`, `checksFor()`, `targetProblems()`, `blocksImport()`, `IMPORT_MODES`,
  `canRollback()`, `sanitizeTargetName()` · `droppedRows.js`: `droppedTable()`, `droppedAsTsv()`, `droppedSummary()` ·
  `useDataImportController.js` (pick → upload → `onInspect` → mappings → `onCommit`), `useImportHistoryController.js`
  (`onList`/`onRollback`), `useDroppedRowsController.js` (`onLoadDropped`/`onDownloadDropped`) ·
  `designs/DataImportSample.jsx`, `ImportHistorySample.jsx`, `DroppedRowsSample.jsx` (both use `XeplrTable` from `@xeplr/ui-table`) ·
  `validateDesign.js` (`DATA_IMPORT_RULES`, `IMPORT_HISTORY_RULES`, `DROPPED_ROWS_RULES`, own copy of `useDesignValidator`) ·
  `pages.jsx` → `DataImportPage`, `ImportHistoryPage`, `DroppedRowsPage`.
- **imports** — the whole screen against `@xeplr/imports` routes. `importsApi.js`: `createImportsApi(basePath)` (all
  routes: /files, /inspect, /check-target, /commit, /runs/:id[/stop], /targets, /history…), `createRunWatcher()`
  (event stream + `LIVE_ASK_MS` safety poll, else `pollMs`), `checkResult()`, `runResults()`, `importProgressText()`,
  `uploaderFor()`, `fileNameOf()`, `ACCEPT` · `useImportsController.js` (database picker, follow run, ✕ stop, history
  version) · `designs/ImportsSample.jsx` · `IMPORTS_RULES` · `pages.jsx` → `ImportsPage` (nests DataImportPage + ImportHistoryPage).
- **url** — `url/urlState.js`: `patchSearch()`, `readSearch()`, `writeFrom()`, `pendingBase()` (pure) ·
  `url/useUrlState.js`: `useUrlParams(defaults, {inUrl})`, `useUrlState(key, opts)`. NOT in `index.js`: import
  `@xeplr/ui-utils/src/url/useUrlState.js` (keeps react-router an optional peer).
- **Fields** (each full MVC + `*Page`): `dropdown/` (`filterByQuery`, `pickSelected`; biggest controller), `dateRange/`
  (`resolveDateValue`, `resolveQuickPreset`, `QUICK_PRESETS`, `rangeProblem`), `rangeField/` (From+To pair, no popover),
  `dateField/`, `numberField/` (`sanitizeNumberInput`, `formatDisplay`), `textField/` (`toValue`, `normalise`, `validate`),
  `colorPicker/` (`parseColor`, `formatColor`), `gridDisplayer/` (`filterRows`/`sortRows` exported as `filterGridRows`/`sortGridRows`).
- **panel** — `panel.js` (`toggleOpen`, `toggleBranch`, `decorateTree`) · `useExpandersController.js`, `useSettingsTreeController.js`
  · `designs/PanelSection.jsx` (`PanelSection`, `PanelField`), `ExpandersSample.jsx`, `SettingsTreeSample.jsx` · `ExpandersPage`, `SettingsTreePage`.
- **Imperative, no React**: `snackbar/snackbar.js` → `raiseSnackbar()`; `confirm/confirm.js` → `raiseConfirm()`, `raiseChoice()`
  (self-mounting DOM, Promise answer, inline styles reading `--xeplr-*` tokens).
- **progress** — `progressSource.js`: `attachProgressSource()` (app adapts its stream once), `subscribeToProgress(key)`,
  `describeProgress()`/`describeComplete()` (sentence built client side) · `ProgressNotifier.jsx` (default export, hidden until its key fires).
- `optionSources/optionSources.js` → `createOptionSources(sources, fetchJson)` (`optionsFrom` lists for ui-jobs/X-Flow).
- `fields/fieldLabel.js` → `fieldLabel()` (camelCase field → words). `theme/index.js` + `default.theme.json` →
  `resolveTheme`, `getThemeVariant`, `getChartOptions`, `inputStyleVars`, `deepMerge`. `data/` → `COUNTRIES`, `STATES`, `STATES_IN`.

## Flow
Import screen: `<ImportsPage basePath>` → `useImportsController` → `createImportsApi().targets()` →
`DataImportPage` → `useDataImportController.pick()` → `uploaderFor()` → `api.upload()` = `uploadFile()` (POST /files) →
`api.inspect()` (background run) → `createRunWatcher().wait()` → `checkResult()` → user maps → `api.commit()` →
`wait()` → `runResults()` → history version bump → `ImportHistoryPage` reloads.
Sign-in: every JSON call → `signedFetch()` → `uploadHeaders()` (`getHeaders()` each call) → on 401 `renewAndRetry()`
→ `renewSignIn()` → app's `renew` (ui-account `renewSession`) → one retry. `uploadFile()` follows the same rule via `options.renewed`.

## To change X, edit Y
- New upload/API header or auth rule → `fileUpload/uploadFile.js` → `configureUpload()` / `uploadHeaders()` / `renewAndRetry()`.
- New import route call → `imports/importsApi.js` → `createImportsApi()`; its screen state → `useImportsController.js`.
- How a run's progress/ending is heard → `importsApi.js` → `createRunWatcher()` (events vs poll); wording → `importProgressText()`, `checkProgressText()`.
- Import mapping, modes (new/append/replace), blocking problems → `dataImport/dataImport.js` → `targetProblems()`, `IMPORT_MODES`.
- Dropped-rows table/copy text → `dataImport/droppedRows.js`.
- A required element of a design → that feature's `validateDesign.js` `*_RULES` (and the Sample must render it).
- Make a page block instead of warn → wrap with `designCheck/useDesignCheck.js` (no page here uses it yet).
- Date presets / fiscal year / day-first parsing → `dateRange/dateRange.js` → `resolveQuickPreset()`, `parseSingleDate()`.
- Dropdown search/sort/multi → `dropdown/dropdown.js` + `useDropdownController.js`.
- URL-driven state semantics (push vs replace, stale closures) → `url/useUrlState.js` → `liveBase()`, `useUrlParams()`; pure parts in `urlState.js`.
- Default colors/sizes for charts, tables, inputs → `theme/default.theme.json`; mapping to CSS vars → `theme/index.js` → `inputStyleVars()`.
- Dialog buttons/keys → `confirm/confirm.js` → `openDialog()`. Toast look → `snackbar/snackbar.js` → `DESIGNS`.
- New export → add to `src/index.js` (nothing is reachable otherwise, except deep imports).

## Rules and traps
- Two validators: `useDesignValidator` (reports: `console.error` + `data-xeplr-design-invalid`, never throws, runs once on
  mount) is what every `pages.jsx` uses; `useDesignCheck` blocks and re-checks each render. Don't make the validator throw.
- `useDesignValidator` exists twice, identical: `fileUpload/validateDesign.js` and `dataImport/validateDesign.js`
  (imports/pages.jsx uses the second). Change both or consolidate.
- Rules for tabbed/stepped designs must use `anyOf` (only one tab is mounted). Rules with `when` only work in `useDesignCheck`.
- `configureUpload` is module-global, set once per app; `DataImportPage` uploads via `uploadFile()` unless `onUpload` is passed.
- `createRunWatcher` must be re-`open()`ed on mount (StrictMode); `useImportsController` does it. Keep `props.events` stable.
- `inspect()` is always `background: true`; results come from a run, not the response.
- CSS classes are `xeplr-<component>-*`; styles read `--xeplr-*` tokens from `@xeplr/ui-account`'s theme.css when present.
- `@xeplr/ui-table` is a peer dependency (used by import designs); `react-router-dom` is an optional peer (only `url/`).

## Test
- `npm test` = `for f in test/*.test.js; do node "$f" || exit 1; done` — plain node, stops at first failing file. No React/DOM;
  tests cover models and `*_RULES` (some read the Sample `.jsx` as text).
- `test/importsApi.test.js` needs `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` and `XEPLR_IMPORTS_DIR`
  (an `@xeplr/imports` checkout with its deps); skipped otherwise. Drives the real router, real Postgres, real SSE.
- `signedFetch.test.js` (401 → renew → retry, local http server), `watcherReopen.test.js` (watcher open/close), `imports.test.js`,
  `dataImport.test.js`, `importModes.test.js`, `droppedRows.test.js`, `designCheck.test.js`, `validateDesign.test.js`,
  `designRules.test.js`, `urlState.test.js`, `urlStateChain.test.js`, plus one per field model.
