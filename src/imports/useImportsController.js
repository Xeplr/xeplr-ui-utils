import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createImportsApi, importProgressText, runResults, historyJob, databasesOf } from './importsApi.js';

/**
 * The whole import screen against @xeplr/imports' routes: which database,
 * the import itself (DataImportPage), its progress and ✕, and the history
 * (ImportHistoryPage) with dropped rows, rollback and delete. No React-free
 * logic lives here — see importsApi.js.
 *
 * @param {object} props
 * @param {string} [props.basePath='/imports'] - where the app mounted the router, as the browser sees it
 * @param {number} [props.pollMs=1000] - how often a running import is asked how far it has got
 */
export function useImportsController(props = {}) {
  var api = useMemo(function() { return createImportsApi(props.basePath); }, [props.basePath]);
  var pollMs = props.pollMs || 1000;

  var [targets, setTargets] = useState([]);
  var [targetsError, setTargetsError] = useState('');
  var [connectionId, setConnectionId] = useState('');
  var [dbInfoId, setDbInfoId] = useState('');
  // The import running now: { runId, startedAt, progress }.
  var [importing, setImporting] = useState(null);
  // Bumped to make the history list read itself again.
  var [historyVersion, setHistoryVersion] = useState(0);
  var mounted = useRef(true);
  useEffect(function() { mounted.current = true; return function() { mounted.current = false; }; }, []);

  useEffect(function() {
    api.targets().then(function(list) {
      if (!mounted.current) return;
      setTargets(list);
      if (list.length) {
        setConnectionId(list[0].connectionId);
        setDbInfoId(((list[0].databases || [])[0] || {}).id || '');
      }
    }, function(err) { if (mounted.current) setTargetsError(err.message); });
  }, [api]);

  function chooseConnection(id) {
    setConnectionId(id);
    setDbInfoId((databasesOf(targets, id)[0] || {}).id || '');
  }

  var onUpload = useCallback(function(file, onProgress) { return api.upload(file, onProgress); }, [api]);

  var onInspect = useCallback(async function(filePath) {
    var found = await api.inspect(filePath);
    return { format: found.format, parts: found.sheets, checks: found.checks };
  }, [api]);

  // Bound to the chosen database, so choosing another asks again.
  var onCheckTarget = useCallback(function(filePath, part) {
    if (!connectionId || !dbInfoId) return Promise.resolve(null);
    return api.checkTarget({ filePath: filePath, sheet: part.part, connectionId: connectionId, dbInfoId: dbInfoId, targetTable: part.target });
  }, [api, connectionId, dbInfoId]);

  // STARTS the import, then asks how far it has got until it ends. The
  // request answers at once with a run id, so no gateway timeout applies.
  var onCommit = useCallback(async function(filePath, mappings, meta) {
    if (!connectionId || !dbInfoId) throw new Error('Choose a database to import into first');
    var started = await api.commit({
      filePath: filePath, connectionId: connectionId, dbInfoId: dbInfoId, originalFileName: meta && meta.originalName,
      mappings: mappings.map(function(m) {
        return { sheet: m.part, targetTable: m.target, mode: m.mode, repairPastedRows: Boolean(m.fixes && m.fixes.pastedRows) };
      })
    });
    setImporting({ runId: started.runId, startedAt: Date.now(), progress: null });
    setHistoryVersion(function(v) { return v + 1; });   // in the history from its first row
    try {
      for (;;) {
        await new Promise(function(r) { setTimeout(r, pollMs); });
        var run = await api.run(started.runId);
        if (run.status !== 'running') return { results: runResults(run) };
        if (mounted.current) setImporting(function(cur) { return cur && cur.runId === run.id ? Object.assign({}, cur, { progress: run.progress }) : cur; });
      }
    } finally {
      if (mounted.current) {
        setImporting(null);
        setHistoryVersion(function(v) { return v + 1; });
      }
    }
  }, [api, connectionId, dbInfoId, pollMs]);

  function stop() {
    if (importing) api.stop(importing.runId).catch(function() {});
  }

  var onList = useCallback(async function() {
    return { jobs: (await api.history()).map(historyJob) };
  }, [api]);
  var onRollback = useCallback(function(job) { return api.rollback(job.id); }, [api]);
  var onDelete = useCallback(function(job) { return api.remove(job.id); }, [api]);
  var onLoadDropped = useCallback(function(job) { return api.dropped(job.id); }, [api]);
  var onDownloadDropped = useCallback(async function(job) {
    var file = await api.droppedFile(job.id);
    var url = URL.createObjectURL(file.blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 0);
  }, [api]);

  return {
    targets: targets,
    targetsError: targetsError,
    connectionId: connectionId,
    dbInfoId: dbInfoId,
    databases: databasesOf(targets, connectionId),
    chooseConnection: chooseConnection,
    chooseDatabase: setDbInfoId,
    importing: importing,
    progressText: importing ? importProgressText(importing.progress) : '',
    stop: stop,
    historyVersion: historyVersion,
    // What the two built-in pages take.
    importProps: { onUpload: onUpload, onInspect: onInspect, onCheckTarget: onCheckTarget, onCommit: onCommit,
      onLoadDropped: onLoadDropped, onDownloadDropped: onDownloadDropped },
    historyProps: { onList: onList, onRollback: onRollback, onDelete: onDelete,
      onLoadDropped: onLoadDropped, onDownloadDropped: onDownloadDropped }
  };
}
