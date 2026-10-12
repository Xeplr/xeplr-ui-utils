import { useEffect, useState } from 'react';
import { uploadFile } from '../fileUpload/uploadFile.js';
import { buildInitialMappings, checksFor, targetProblems, blocksImport, IMPORT_MODES } from './dataImport.js';

/**
 * @param {object} options
 * @param {string} [options.accept] - file input accept attribute, e.g. '.csv,.json,.xlsx,.xls'
 * @param {string} [options.targetLabel='Target'] - placeholder/label for the target-name field
 * @param {(filePath: string, file: File) => Promise<{format: string, parts?: string[], checks?: object}>} options.onInspect
 *   - required. App-supplied: given a file ALREADY uploaded (see below), what
 *     does it contain? (format, and for a multi-part file like an Excel
 *     workbook, its part/sheet names).
 * @param {(filePath: string, mappings: {part: string|null, target: string, mode: string, fixes: object}[], meta: {originalName: string}) => Promise<{results: object[]}>} options.onCommit
 *   (each mapping's `fixes` is the person's choice for each fix the inspect
 *   step's `checks` offered — see checksFor in dataImport.js)
 *   - required. App-supplied: load the included parts into their targets.
 *     meta.originalName is the picked file's own name (not the server-side
 *     path) — pass it through if the app wants it recorded (e.g. import
 *     history), it's otherwise unused by this controller.
 *
 * @param {(filePath: string, target: {part: string|null, target: string}) => Promise<{exists, matched, extra, missing}>} [options.onCheckTarget]
 *   - optional. App-supplied: the part's columns against the table it names —
 *     asked as the person types, so what will happen (refused, columns left
 *     empty, a table that already exists) is said before anything is loaded.
 *     Without it no check is made and nothing is blocked.
 *
 * The actual file transfer is NOT app-supplied — handleFileChange sends the
 * picked file through @xeplr/ui-utils' own uploadFile() (see
 * fileUpload/uploadFile.js), which every app configures ONCE via
 * configureUpload({url, getHeaders}) to point at @xeplr/base-apis' generic
 * uploadRoute. That's what keeps this component product/app-independent: it
 * never needs app-specific upload wiring, only the (unavoidably app-specific)
 * "what's in this file" and "where does it go" steps after the file already
 * has a server-side path.
 */
export function useDataImportController(options = {}) {
  var [file, setFile] = useState(null);
  var [inspecting, setInspecting] = useState(false);
  var [inspected, setInspected] = useState(null);
  var [mappings, setMappings] = useState([]);
  var [committing, setCommitting] = useState(false);
  var [results, setResults] = useState(null);
  var [error, setError] = useState('');
  // The app's comparison of each part with the table it names, by
  // part + target: { loading, result, error }. The mode is not part of the
  // key — switching it changes what is said, not what the table is.
  // Kept with the onCheckTarget that answered: a new one (another database,
  // say) means a new question, and the old answers no longer apply.
  var [checkStore, setCheckStore] = useState({ by: null, map: {} });
  var onCheckTarget = options.onCheckTarget;
  var targetChecks = checkStore.by === onCheckTarget ? checkStore.map : {};
  function setTargetChecks(update) {
    setCheckStore(function(prev) {
      var map = prev.by === onCheckTarget ? prev.map : {};
      return { by: onCheckTarget, map: update(map) };
    });
  }

  function reset() {
    setCheckStore({ by: null, map: {} });
    setFile(null);
    setInspected(null);
    setMappings([]);
    setResults(null);
    setError('');
  }

  async function handleFileChange(e) {
    var picked = e.target.files && e.target.files[0];
    if (!picked) return;
    reset();
    setFile(picked);
    setInspecting(true);
    try {
      var uploadRes = await uploadFile(picked);
      var inspectRes = await options.onInspect(uploadRes.filePath, picked);
      var merged = Object.assign({ filePath: uploadRes.filePath, originalName: picked.name }, inspectRes);
      setInspected(merged);
      setMappings(buildInitialMappings(Object.assign({ originalName: picked.name }, merged)));
    } catch (err) {
      setError(err.message || 'Failed to upload/inspect file');
    } finally {
      setInspecting(false);
    }
  }

  // A fix the inspect step offered, switched on or off for one part.
  function setFix(index, key, on) {
    setMappings(function(prev) {
      var next = prev.slice();
      next[index] = Object.assign({}, next[index], { fixes: Object.assign({}, next[index].fixes, { [key]: on }) });
      return next;
    });
  }

  function updateMapping(index, patch) {
    setMappings(function(prev) {
      var next = prev.slice();
      next[index] = Object.assign({}, next[index], patch);
      return next;
    });
  }

  // ASKED AS THE PERSON TYPES, once they pause: every included part whose
  // part + target has not been checked yet. Each answer is kept under its own
  // part + target, so one that arrives late lands where it belongs.
  var checkKey = mappings.map(function(m) { return m.include ? keyOf(m) : ''; }).join('\u0001');
  useEffect(function() {
    if (!onCheckTarget || !inspected) return undefined;
    var wanted = mappings.filter(function(m) { return m.include && String(m.target || '').trim() && !targetChecks[keyOf(m)]; });
    if (!wanted.length) return undefined;
    var timer = setTimeout(function() {
      wanted.forEach(function(m) {
        var key = keyOf(m);
        setTargetChecks(function(prev) { return Object.assign({}, prev, { [key]: { loading: true } }); });
        Promise.resolve(onCheckTarget(inspected.filePath, { part: m.part, target: String(m.target).trim() })).then(function(result) {
          setTargetChecks(function(prev) { return Object.assign({}, prev, { [key]: { result: result || null } }); });
        }, function(err) {
          setTargetChecks(function(prev) { return Object.assign({}, prev, { [key]: { error: err.message || 'Could not check the table' } }); });
        });
      });
    }, 400);
    return function() { clearTimeout(timer); };
  }, [checkKey, inspected, onCheckTarget]);

  // What each part's target will do, said under it: [{ level, message }].
  var problems = mappings.map(function(m) {
    var c = targetChecks[keyOf(m)];
    if (!m.include || !c) return [];
    if (c.error) return [{ level: 'warning', message: 'Could not check the table: ' + c.error }];
    return c.result ? targetProblems(String(m.target).trim(), m.mode, c.result) : [];
  });
  var checking = mappings.some(function(m) { var c = targetChecks[keyOf(m)]; return m.include && c && c.loading; });
  var blocked = mappings.some(function(m, i) { return m.include && blocksImport(problems[i]); }) ||
    mappings.some(function(m) { return m.include && !String(m.target || '').trim(); });

  async function handleCommit() {
    var included = mappings.filter(function(m) { return m.include; });
    if (!inspected || included.length === 0 || blocked) return;
    setCommitting(true);
    setError('');
    try {
      var payload = included.map(function(m) { return { part: m.part, target: String(m.target).trim(), mode: m.mode, fixes: m.fixes || {} }; });
      var res = await options.onCommit(inspected.filePath, payload, { originalName: inspected.originalName });
      setResults((res && res.results) || res || []);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setCommitting(false);
    }
  }

  return {
    file, inspecting, inspected, mappings, committing, results, error,
    handleFileChange, updateMapping, setFix, handleCommit, reset,
    // The import's mode per part, what its target will do, and whether that stops it.
    modes: IMPORT_MODES,
    setMode: function(index, mode) { updateMapping(index, { mode: mode }); },
    problems: problems,
    checking: checking,
    blocked: blocked,
    checksOf: function(part) { return checksFor(inspected, part); },
    accept: options.accept,
    targetLabel: options.targetLabel || 'Target'
  };
}

function keyOf(m) { return (m.part == null ? '' : m.part) + '\u0000' + String(m.target || '').trim(); }
