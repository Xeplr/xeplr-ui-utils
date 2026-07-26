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

// inspectResult: { filePath, format, originalName?, parts?: string[] }
// -> [{ part: string|null, target: string, include: boolean }]
//
// parts present (e.g. Excel sheets) -> one row per part, all included by
// default. parts absent (e.g. CSV/JSON — the whole file is one unit) -> a
// single row with part:null, named from the file itself.
export function buildInitialMappings(inspectResult) {
  if (inspectResult.parts && inspectResult.parts.length) {
    return inspectResult.parts.map(function(part) {
      return { part: part, target: sanitizeTargetName(part), include: true };
    });
  }
  return [{ part: null, target: sanitizeTargetName(inspectResult.originalName || 'data'), include: true }];
}
