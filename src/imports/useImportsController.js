import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createImportsApi, importProgressText, checkProgressText, runResults, checkResult, historyJob, databasesOf, uploaderFor,
  createRunWatcher
} from './importsApi.js';

/**
 * The whole import screen against @xeplr/imports' routes: which database,
 * the import itself (DataImportPage), its progress and ✕, and the history
 * (ImportHistoryPage) with dropped rows, rollback and delete. No React-free
 * logic lives here — see importsApi.js.
 *
 * @param {object} props
 * @param {string} [props.basePath='/imports'] - where the app mounted the router, as the browser sees it
 * @param {number} [props.pollMs=1000] - how often a running check or import is asked how far it has got, when there is no event stream
 * @param {(file, onProgress, { standard }) => Promise<{ filePath }>} [props.upload] - the app's own way to send a file (see uploaderFor)
 * @param {{ subscribe: Function, isLive?: Function }} [props.events] - the app's event stream, so a run is heard rather
 *        than asked about (see createRunWatcher). Keep the object the same between renders.
 */
export function useImportsController(props = {}) {
  var api = useMemo(function() { return createImportsApi(props.basePath); }, [props.basePath]);
  var pollMs = props.pollMs || 1000;
  var events = props.events;
  var watcher = useMemo(function() { return createRunWatcher({ api: api, events: events, pollMs: pollMs }); }, [api, events, pollMs]);
  // open() on every mount: StrictMode's mount → cleanup → mount would
  // otherwise leave it closed and no run would ever be heard finishing.
  useEffect(function() { watcher.open(); return function() { watcher.close(); }; }, [watcher]);

  var [targets, setTargets] = useState([]);
  var [targetsError, setTargetsError] = useState('');
  var [connectionId, setConnectionId] = useState('');
  var [dbInfoId, setDbInfoId] = useState('');
  // The check or import running now: { runId, kind: 'check' | 'import', startedAt, progress }.
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

  var upload = props.upload;
  var onUpload = useMemo(function() { return uploaderFor(api, upload); }, [api, upload]);

  /** Wait for a run, showing how far it has got on the progress line. */
  var follow = useCallback(async function(runId, kind) {
    setImporting({ runId: runId, kind: kind, startedAt: Date.now(), progress: null });
    try {
      return await watcher.wait(runId, function(progress) {
        if (mounted.current) setImporting(function(cur) { return cur && cur.runId === runId ? Object.assign({}, cur, { progress: progress }) : cur; });
      });
    } finally {
      if (mounted.current) setImporting(function(cur) { return cur && cur.runId === runId ? null : cur; });
    }
  }, [watcher]);

  // The check reads every row — minutes on a big CSV — so it runs in the
  // background like the import. A server before @xeplr/imports 2.0.2 answers
  // at once, without a run.
  var onInspect = useCallback(async function(filePath) {
    var found = await api.inspect(filePath);
    if (!found.runId) return { format: found.format, parts: found.sheets, checks: found.checks };
    return checkResult(await follow(found.runId, 'check'));
  }, [api, follow]);

  // Bound to the chosen database, so choosing another asks again.
  var onCheckTarget = useCallback(function(filePath, part) {
    if (!connectionId || !dbInfoId) return Promise.resolve(null);
    return api.checkTarget({ filePath: filePath, sheet: part.part, connectionId: connectionId, dbInfoId: dbInfoId, targetTable: part.target });
  }, [api, connectionId, dbInfoId]);

  // STARTS the import, then follows it until it ends. The request answers at
  // once with a run id, so no gateway timeout applies.
  var onCommit = useCallback(async function(filePath, mappings, meta) {
    if (!connectionId || !dbInfoId) throw new Error('Choose a database to import into first');
    var started = await api.commit({
      filePath: filePath, connectionId: connectionId, dbInfoId: dbInfoId, originalFileName: meta && meta.originalName,
      mappings: mappings.map(function(m) {
        return { sheet: m.part, targetTable: m.target, mode: m.mode, repairPastedRows: Boolean(m.fixes && m.fixes.pastedRows) };
      })
    });
    setHistoryVersion(function(v) { return v + 1; });   // in the history from its first row
    try {
      return { results: runResults(await follow(started.runId, 'import')) };
    } finally {
      if (mounted.current) setHistoryVersion(function(v) { return v + 1; });
    }
  }, [api, connectionId, dbInfoId, follow]);

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
    progressText: !importing ? '' : importing.kind === 'check' ? checkProgressText(importing.progress) : importProgressText(importing.progress),
    stop: stop,
    historyVersion: historyVersion,
    // What the two built-in pages take.
    importProps: { onUpload: onUpload, onInspect: onInspect, onCheckTarget: onCheckTarget, onCommit: onCommit,
      onLoadDropped: onLoadDropped, onDownloadDropped: onDownloadDropped },
    historyProps: { onList: onList, onRollback: onRollback, onDelete: onDelete,
      onLoadDropped: onLoadDropped, onDownloadDropped: onDownloadDropped }
  };
}
