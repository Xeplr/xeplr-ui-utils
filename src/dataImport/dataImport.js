// DataImport — model. Pure functions, no React/DOM — see
// useDataImportController.js for the stateful wiring.
//
// The shape this whole module works with: a file is inspected (app-supplied
// onInspect) and comes back as either a single unit or a list of named
// PARTS (e.g. an Excel workbook's sheet names) — each part maps to a named
// TARGET the app will load it into (e.g. a DB table). Deliberately generic
// vocabulary (part/target, not sheet/table) — the app decides what a "part"
// and "target" mean; this module only handles the mapping UI + flow.

export function sanitizeTargetName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')        // strip a file extension, if any
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'table';
}

// What the inspect step found wrong with one part, if anything:
//   inspectResult.checks = { [part]: [{ key, message, fixLabel?, fixDefault? }] }
// (the key '' for a file that is one unit). A check with a fixLabel offers a
// fix the person switches on or off before importing; its choice travels
// with the mapping as fixes[key].
export function checksFor(inspectResult, part) {
  var all = (inspectResult && inspectResult.checks) || {};
  return all[part == null ? '' : part] || [];
}

function initialFixes(inspectResult, part) {
  var fixes = {};
  checksFor(inspectResult, part).forEach(function(c) {
    if (c.fixLabel) fixes[c.key] = c.fixDefault !== false;
  });
  return fixes;
}

// inspectResult: { filePath, format, originalName?, parts?: string[], checks? }
// -> [{ part: string|null, target: string, include: boolean, mode, fixes: { [key]: boolean } }]
//
// parts present (e.g. Excel sheets) -> one row per part, all included by
// default. parts absent (e.g. CSV/JSON — the whole file is one unit) -> a
// single row with part:null, named from the file itself.
export function buildInitialMappings(inspectResult) {
  if (inspectResult.parts && inspectResult.parts.length) {
    return inspectResult.parts.map(function(part) {
      return { part: part, target: sanitizeTargetName(part), include: true, mode: DEFAULT_MODE, fixes: initialFixes(inspectResult, part) };
    });
  }
  return [{ part: null, target: sanitizeTargetName(inspectResult.originalName || 'data'), include: true, mode: DEFAULT_MODE, fixes: initialFixes(inspectResult, null) }];
}

// ── What the import does to its target ──────────────────────────────────
//
// New table: it must not exist yet. Append: add to one that exists. Replace:
// empty one that exists and load the file — the app makes that safe (BI
// stages it, so a failed import leaves the table as it was) and it cannot be
// rolled back. New is the default: adding to or emptying a table someone
// typed the name of is something they choose, not something that happens.
export var IMPORT_MODES = [
  { key: 'new', label: 'New table' },
  { key: 'append', label: 'Append' },
  { key: 'replace', label: 'Replace' }
];
export var DEFAULT_MODE = 'new';

/**
 * What will happen to the target, said before anything is loaded, from the
 * app's comparison of the file with the table (onCheckTarget):
 *   check = { exists, matched: string[], extra: string[], missing: [{ name, required }] }
 *
 * @returns {[{ level: 'error'|'warning'|'info'|'ok', message }]} — an 'error'
 *          blocks the import.
 */
export function targetProblems(target, mode, check) {
  if (!check) return [];
  var name = '"' + target + '"';
  var out = [];
  if (!check.exists) {
    if (mode === 'new') return [{ level: 'info', message: 'A new table ' + name + ' will be created from the file.' }];
    return [{ level: 'error', message: 'There is no table ' + name + '. Check the name, or choose New table.' }];
  }
  if (mode === 'new') {
    return [{ level: 'error', message: 'Table ' + name + ' already exists. Choose Append to add to it or Replace to replace its rows, or type a new name.' }];
  }
  var extra = check.extra || [];
  var missing = check.missing || [];
  var required = missing.filter(function(m) { return m.required; });
  var optional = missing.filter(function(m) { return !m.required; });
  if (extra.length) {
    out.push({ level: 'error', message: 'The file has ' + countOf(extra.length, 'column') + ' the table does not: ' + listOf(extra) +
      '. The import would be refused — rename or remove ' + (extra.length === 1 ? 'it' : 'them') + ' in the file.' });
  }
  if (required.length) {
    out.push({ level: 'error', message: 'The table needs ' + listOf(required.map(nameOf)) + ', which the file does not have — every row would be refused.' });
  }
  if (optional.length) {
    out.push({ level: 'info', message: 'The table has ' + listOf(optional.map(nameOf)) + ', which the file does not — ' +
      (optional.length === 1 ? 'it' : 'they') + ' will be left empty.' });
  }
  if (!extra.length && !missing.length) {
    out.push({ level: 'ok', message: 'All ' + countOf((check.matched || []).length, 'column') + ' match the table.' });
  }
  if (mode === 'replace') {
    out.push({ level: 'warning', message: 'Replace removes every row now in ' + name + ' and puts the file\'s rows in their place. It cannot be rolled back.' });
  }
  return out;
}

/** Whether these problems stop the import. */
export function blocksImport(problems) {
  return (problems || []).some(function(p) { return p.level === 'error'; });
}

/** Whether a past import can be undone: a Replace cannot — its old rows are gone. */
export function canRollback(job) {
  return !!job && job.status === 'completed' && job.mode !== 'replace';
}

/** The words for a mode, for a history row: 'Replace', 'Append', 'New table'. */
export function modeLabel(mode) {
  var m = IMPORT_MODES.filter(function(x) { return x.key === mode; })[0];
  return m ? m.label : '';
}

function nameOf(m) { return m.name; }
function countOf(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
function listOf(names) {
  var shown = names.slice(0, 6).map(function(n) { return '"' + n + '"'; }).join(', ');
  return names.length > 6 ? shown + ' and ' + (names.length - 6) + ' more' : shown;
}
