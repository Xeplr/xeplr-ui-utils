import { useState } from 'react';
import { uploadFile } from '../fileUpload/uploadFile.js';
import { buildInitialMappings } from './dataImport.js';

/**
 * @param {object} options
 * @param {string} [options.accept] - file input accept attribute, e.g. '.csv,.json,.xlsx,.xls'
 * @param {string} [options.targetLabel='Target'] - placeholder/label for the target-name field
 * @param {(filePath: string, file: File) => Promise<{format: string, parts?: string[]}>} options.onInspect
 *   - required. App-supplied: given a file ALREADY uploaded (see below), what
 *     does it contain? (format, and for a multi-part file like an Excel
 *     workbook, its part/sheet names).
 * @param {(filePath: string, mappings: {part: string|null, target: string}[], meta: {originalName: string}) => Promise<{results: object[]}>} options.onCommit
 *   - required. App-supplied: load the included parts into their targets.
 *     meta.originalName is the picked file's own name (not the server-side
 *     path) — pass it through if the app wants it recorded (e.g. import
 *     history), it's otherwise unused by this controller.
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

  function reset() {
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

  function updateMapping(index, patch) {
    setMappings(function(prev) {
      var next = prev.slice();
      next[index] = Object.assign({}, next[index], patch);
      return next;
    });
  }

  async function handleCommit() {
    var included = mappings.filter(function(m) { return m.include; });
    if (!inspected || included.length === 0) return;
    setCommitting(true);
    setError('');
    try {
      var payload = included.map(function(m) { return { part: m.part, target: m.target }; });
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
    handleFileChange, updateMapping, handleCommit, reset,
    accept: options.accept,
    targetLabel: options.targetLabel || 'Target'
  };
}
