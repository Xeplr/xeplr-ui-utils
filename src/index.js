// File Upload — model
export { configureUpload, uploadFile } from './fileUpload/uploadFile.js';

// File Upload — controller
export { useFileUploadController } from './fileUpload/useFileUploadController.js';

// File Upload — design validation
export { useDesignValidator, FILE_UPLOAD_RULES } from './fileUpload/validateDesign.js';

// File Upload — sample design
export { FileUploadSample } from './fileUpload/designs/index.js';

// File Upload — ready-made page
export { FileUploadPage } from './fileUpload/pages.jsx';

// DataImport — model. Upload a file, map its parts (e.g. Excel sheets — or
// the whole file, for CSV/JSON) to app-defined named targets, commit. The
// app supplies onInspect/onCommit (its own upload + load endpoints); this
// module only owns the file-pick -> mapping -> commit flow and UI.
export { sanitizeTargetName, buildInitialMappings } from './dataImport/dataImport.js';

// DataImport — controller
export { useDataImportController } from './dataImport/useDataImportController.js';

// DataImport — design validation
export { DATA_IMPORT_RULES } from './dataImport/validateDesign.js';

// DataImport — sample design
export { DataImportSample } from './dataImport/designs/index.js';

// DataImport — ready-made page
export { DataImportPage } from './dataImport/pages.jsx';

// ImportHistory — lists past import jobs (app-supplied onList) with a
// Rollback action per row (app-supplied onRollback) — the read/undo side of
// DataImportPage's write side, same file/model. Product-agnostic: the app
// owns what "list" and "rollback" actually call.
export { useImportHistoryController } from './dataImport/useImportHistoryController.js';
export { IMPORT_HISTORY_RULES } from './dataImport/validateDesign.js';
export { ImportHistorySample } from './dataImport/designs/index.js';
export { ImportHistoryPage } from './dataImport/pages.jsx';

// NumberField — model
export {
  NUMBER_TYPES,
  sanitizeNumberInput,
  toNumeric,
  formatDisplay,
  validateRange,
  resolveAffixState
} from './numberField/numberField.js';

// NumberField — controller
export { useNumberFieldController } from './numberField/useNumberFieldController.js';

// NumberField — design validation
export { NUMBER_FIELD_RULES } from './numberField/validateDesign.js';

// NumberField — sample design
export { NumberFieldSample } from './numberField/designs/index.js';

// NumberField — ready-made page
export { NumberFieldPage } from './numberField/pages.jsx';

// DateField — model
export {
  DATE_TYPES,
  isValidISODate,
  calculateAge,
  inputTypeFor,
  toInputValue,
  validateBounds
} from './dateField/dateField.js';

// DateField — controller
export { useDateFieldController } from './dateField/useDateFieldController.js';

// DateField — design validation
export { DATE_FIELD_RULES } from './dateField/validateDesign.js';

// DateField — sample design
export { DateFieldSample } from './dateField/designs/index.js';

// DateField — ready-made page
export { DateFieldPage } from './dateField/pages.jsx';

// DateRange — model. One selection covering a quick preset, an explicit
// range, or a single day/month/year; everything resolves to {from, to}.
export {
  QUICK_PRESETS,
  parseSingleDate,
  resolveQuickPreset,
  resolveDateValue,
  dateValueLabel,
  dateValueIsSet
} from './dateRange/dateRange.js';

// DateRange — controller
export { useDateRangeController } from './dateRange/useDateRangeController.js';

// DateRange — design validation
export { DATE_RANGE_RULES } from './dateRange/validateDesign.js';

// DateRange — sample design
export { DateRangeSample } from './dateRange/designs/index.js';

// DateRange — ready-made page
export { DateRangePage } from './dateRange/pages.jsx';

// RangeField — model. Not DateRange (below) — that's a full quick/range/
// single POPOVER picker; this is just a From+To pair rendered as one field,
// for a caller that already knows it wants an explicit range and has
// nowhere to put a popover.
export { RANGE_TYPES, emptyRange, normalizeRange, rangeIsSet } from './rangeField/rangeField.js';

// RangeField — controller
export { useRangeFieldController } from './rangeField/useRangeFieldController.js';

// RangeField — design validation
export { RANGE_FIELD_RULES } from './rangeField/validateDesign.js';

// RangeField — sample design
export { RangeFieldSample } from './rangeField/designs/index.js';

// RangeField — ready-made page
export { RangeFieldPage } from './rangeField/pages.jsx';

// Dropdown — model
export {
  DROPDOWN_MODES,
  normalizeKeys,
  sortByKey,
  filterByQuery,
  pickSelected
} from './dropdown/dropdown.js';

// Dropdown — controller
export { useDropdownController } from './dropdown/useDropdownController.js';

// Dropdown — design validation
export { DROPDOWN_RULES } from './dropdown/validateDesign.js';

// Dropdown — sample design
export { DropdownSample } from './dropdown/designs/index.js';

// Dropdown — ready-made page
export { DropdownPage } from './dropdown/pages.jsx';

// GridDisplayer — model
export { filterRows as filterGridRows, sortRows as sortGridRows } from './gridDisplayer/gridDisplayer.js';

// GridDisplayer — controller
export { useGridDisplayerController } from './gridDisplayer/useGridDisplayerController.js';

// GridDisplayer — design validation
export { GRID_DISPLAYER_RULES } from './gridDisplayer/validateDesign.js';

// GridDisplayer — sample design
export { GridDisplayerSample } from './gridDisplayer/designs/index.js';

// GridDisplayer — ready-made page
export { GridDisplayerPage } from './gridDisplayer/pages.jsx';

// Snackbar
export { raiseSnackbar } from './snackbar/snackbar.js';

// Confirm
export { raiseConfirm, raiseChoice } from './confirm/confirm.js';

// Theme — brand-neutral DEFAULT design tokens (chart + table), override-friendly.
// Consumers pass overrides to resolveTheme(); overrides win, rest falls through.
export { default as DEFAULT_THEME, resolveTheme, getThemeVariant, getChartOptions, inputStyleVars, deepMerge } from './theme/index.js';

// Static data
export { default as COUNTRIES } from './data/countries.json';
import _statesData from './data/states.json';
export var STATES = _statesData.STATES;
export var STATES_IN = _statesData.STATES_IN;

// TextField — the plain text input, its multiline and search shapes.
export { TEXT_TYPES, toValue, normalise, validate, remaining } from './textField/textField.js';
export { useTextFieldController } from './textField/useTextFieldController.js';
export { TEXT_FIELD_RULES } from './textField/validateDesign.js';
export { TextFieldSample } from './textField/designs/index.js';
export { TextFieldPage } from './textField/pages.jsx';

// ── Progress notifier ────────────────────────────────────────────────────
//
// A small moving bar and a line of text, driven by an event KEY the back end
// chooses. Hidden until an event for that key arrives, so it is safe to mount
// on anything; visible while the work says it is continuing.
//
// An app attaches its own stream ONCE with attachProgressSource, adapting
// whatever it publishes into { key, continue, status?, data }. This package
// knows nothing about SSE — see progressSource.js for why the sentence is
// built on the client rather than sent as prose.
export { attachProgressSource, progressSourceAttached, subscribeToProgress,
         describeProgress, describeComplete } from './progress/progressSource.js';
export { default as ProgressNotifier } from './progress/ProgressNotifier.jsx';
