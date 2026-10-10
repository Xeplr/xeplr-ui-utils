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
// -> [{ part: string|null, target: string, include: boolean, fixes: { [key]: boolean } }]
//
// parts present (e.g. Excel sheets) -> one row per part, all included by
// default. parts absent (e.g. CSV/JSON — the whole file is one unit) -> a
// single row with part:null, named from the file itself.
export function buildInitialMappings(inspectResult) {
  if (inspectResult.parts && inspectResult.parts.length) {
    return inspectResult.parts.map(function(part) {
      return { part: part, target: sanitizeTargetName(part), include: true, fixes: initialFixes(inspectResult, part) };
    });
  }
  return [{ part: null, target: sanitizeTargetName(inspectResult.originalName || 'data'), include: true, fixes: initialFixes(inspectResult, null) }];
}
