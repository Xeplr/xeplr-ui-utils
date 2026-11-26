// IMPORTS — model. The calls @xeplr/imports' routes answer, and the pure
// helpers the page needs. No React; fetch and XMLHttpRequest only.
//
// basePath is where the app mounted the router as the browser sees it —
// '/imports', or '/api/imports' behind a proxy prefix. Requests carry the
// headers configureUpload was given (uploadHeaders): sign-in and tenancy.

import { uploadFile, signedFetch } from '../fileUpload/uploadFile.js';

/**
 * How a picked file is sent: the app's own `upload` when it gives one —
 * handed the file, the progress callback and the standard sender, so it can
 * keep the standard one for most files and send a big one its own way (in
 * pieces, say) — else the standard: one request to /files. Either answers
 * { filePath } inside the tenant's uploads/ folder, which is all the import
 * needs.
 */
export function uploaderFor(api, upload) {
  if (typeof upload !== 'function') return function(file, onProgress) { return api.upload(file, onProgress); };
  return function(file, onProgress) { return upload(file, onProgress, { standard: api.upload }); };
}

/** The files the import reads, for the file input. */
export var ACCEPT = '.csv,.json,.xlsx,.xls,.parquet';

/** The import routes under one base path. Every call rejects with the server's own `error`. */
export function createImportsApi(basePath) {
  var base = String(basePath || '/imports').replace(/\/+$/, '');

  async function call(method, path, body) {
    var headers = body ? { 'content-type': 'application/json' } : {};
    // signedFetch: the upload headers, and one renewal of an expired sign-in.
    var res = await signedFetch(base + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
    var data = await res.json().catch(function() { return {}; });
    if (!res.ok) throw new Error(data.error || ('The request failed (' + res.status + ')'));
    return data;
  }

  return {
    upload: function(file, onProgress) { return uploadFile(file, { url: base + '/files', onProgress: onProgress }); },
    // In the background: on a big CSV the check reads every row, for minutes.
    inspect: function(filePath) { return call('POST', '/inspect', { filePath: filePath, background: true }); },
    checkTarget: function(body) { return call('POST', '/check-target', body); },
    commit: function(body) { return call('POST', '/commit', body); },
    run: function(runId) { return call('GET', '/runs/' + encodeURIComponent(runId)); },
    stop: function(runId) { return call('POST', '/runs/' + encodeURIComponent(runId) + '/stop'); },
    targets: async function() { return (await call('GET', '/targets')).dataArray || []; },
    history: async function() { return (await call('GET', '/history')).dataArray || []; },
    dropped: function(id) { return call('GET', '/history/' + encodeURIComponent(id) + '/dropped'); },
    rollback: function(id) { return call('POST', '/history/' + encodeURIComponent(id) + '/rollback'); },
    remove: function(id) { return call('POST', '/history/' + encodeURIComponent(id) + '/delete'); },
    /** The dropped rows as a file: { blob, name } — saving it is the page's job. */
    droppedFile: async function(id) {
      var res = await signedFetch(base + '/history/' + encodeURIComponent(id) + '/dropped/file');
      if (!res.ok) {
        var data = await res.json().catch(function() { return {}; });
        throw new Error(data.error || ('The download failed (' + res.status + ')'));
      }
      return { blob: await res.blob(), name: fileNameOf(res.headers.get('content-disposition'), 'dropped rows.xlsx') };
    }
  };
}

/** The file name a Content-Disposition gives — filename* (UTF-8) first. */
export function fileNameOf(disposition, fallback) {
  var cd = String(disposition || '');
  var star = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  if (star) { try { return decodeURIComponent(star[1]); } catch (e) { /* the plain one */ } }
  var plain = /filename="([^"]+)"/i.exec(cd);
  return plain ? plain[1] : fallback;
}

// ── WAITING FOR A RUN ──────────────────────────────────────────────────
//
// A check and an import both run in the background on the server and answer
// with a run id. How the page hears how far one has got and how it ended:
//
//   On the app's event stream, when it gives one (`events`): the server tells
//   each run as it moves and once when it ends (@xeplr/imports' `publish`).
//   The stream is listened to from the moment the watcher is made, so an event
//   is not missed for want of a listener; after a run starts it is asked about
//   ONCE (it may have ended before its id came back), then waited for. While
//   the stream is live it is asked again only every LIVE_ASK_MS — a safety net
//   for a lost event, not the way the answer comes.
//
//   Without a stream, or while it is down (`events.isLive()` false): asked
//   every pollMs, as before.
//
//   events = { subscribe(handler) → unsubscribe, isLive?() → boolean }
//   handler gets each event's data: { type: 'import-run', runId, kind, status,
//   progress, result, error }; anything else is ignored.

export var LIVE_ASK_MS = 15000;

/**
 * @param {object} opts - { api, events?, pollMs? }
 * @returns {{ wait(runId, onProgress) → Promise<run>, close() }} the run as GET /runs/:id gives it, once it ended
 */
export function createRunWatcher(opts) {
  var api = opts.api;
  var events = opts.events && typeof opts.events.subscribe === 'function' ? opts.events : null;
  var pollMs = opts.pollMs || 1000;
  var waiting = new Map();   // runId → { onProgress, done }
  var closed = false;

  function heard(run) {
    var w = waiting.get(run.runId || run.id);
    if (!w) return;
    if (run.status === 'running') { if (w.onProgress) w.onProgress(run.progress || null); return; }
    w.done(run);
  }
  var unsubscribe = null;
  function listen() {
    if (!events || unsubscribe) return;
    unsubscribe = events.subscribe(function(e) {
      if (e && e.type === 'import-run' && e.runId) heard(e);
    });
  }
  listen();

  function live() {
    if (!events) return false;
    try { return typeof events.isLive === 'function' ? Boolean(events.isLive()) : true; } catch (e) { return false; }
  }

  function wait(runId, onProgress) {
    return new Promise(function(resolve, reject) {
      var timer = null;
      var over = false;
      function done(run) {
        if (over) return;
        over = true;
        waiting.delete(runId);
        if (timer) clearTimeout(timer);
        resolve(Object.assign({}, run, { id: runId }));
      }
      function fail(err) {
        if (over) return;
        over = true;
        waiting.delete(runId);
        if (timer) clearTimeout(timer);
        reject(err);
      }
      waiting.set(runId, { onProgress: onProgress, done: done });
      async function ask() {
        timer = null;
        if (over || closed) return;
        try {
          var run = await api.run(runId);
          if (over) return;
          if (run.status !== 'running') return done(run);
          if (onProgress) onProgress(run.progress || null);
        } catch (err) {
          // With a stream the run may be on another API process, which does
          // not know it: the stream still carries its ending.
          if (!events) return fail(err);
        }
        if (!over && !closed) timer = setTimeout(ask, live() ? LIVE_ASK_MS : pollMs);
      }
      ask();
    });
  }

  return {
    wait: wait,
    // Open again after close(). React's StrictMode (development) mounts,
    // cleans up and mounts again: closed for good on the cleanup, the watcher
    // never asked about a run again and a check sat on "Checking the file…"
    // although the server had finished it. The hook re-opens it on each mount.
    open: function() {
      closed = false;
      listen();
    },
    close: function() {
      closed = true;
      if (unsubscribe) { try { unsubscribe(); } catch (e) { /* gone already */ } }
      unsubscribe = null;
      waiting.clear();
    }
  };
}

/** What a finished check found, in onInspect's shape — or the error it ended with. */
export function checkResult(run) {
  if (run.status === 'error') throw new Error(run.error || 'The check failed');
  if (run.status === 'stopped') throw new Error(run.error === 'Stopped' || !run.error ? 'The check was stopped.' : run.error);
  var found = run.result || {};
  return { format: found.format, parts: found.sheets, checks: found.checks };
}

/** "Checking the file · 1.2 GB of 3.0 GB (40%) · 412,000 rows" — how far a check has got. */
export function checkProgressText(p) {
  if (!p) return 'Checking the file…';
  var parts = [];
  if (p.parts > 1) parts.push('sheet ' + p.part + ' of ' + p.parts + (p.sheet ? ' (' + p.sheet + ')' : ''));
  if (p.bytesRead != null && p.bytes) {
    parts.push(sizeText(p.bytesRead) + ' of ' + sizeText(p.bytes) + ' (' + Math.min(100, Math.floor((p.bytesRead / p.bytes) * 100)) + '%)');
  }
  if (p.rowsRead != null) parts.push(Number(p.rowsRead).toLocaleString() + ' rows');
  return 'Checking the file' + (parts.length ? ' · ' + parts.join(' · ') : '…');
}

/** 512 KB, 340 MB, 2.4 GB. */
export function sizeText(bytes) {
  var mb = bytes / 1024 / 1024;
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  if (mb >= 1) return Math.round(mb) + ' MB';
  return Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

/** "Sheet 2 of 3 (Orders) · 412,000 rows read · 400,000 written" — how far an import has got. */
export function importProgressText(p) {
  if (!p) return 'Importing — reading the file…';
  var parts = [];
  if (p.mappings > 1) parts.push('Sheet ' + p.mapping + ' of ' + p.mappings + (p.sheet ? ' (' + p.sheet + ')' : ''));
  if (p.rowsRead != null) parts.push(Number(p.rowsRead).toLocaleString() + ' rows read');
  if (p.rowsWritten != null) parts.push(Number(p.rowsWritten).toLocaleString() + ' written');
  if (p.phase === 'merging') parts.push('replacing the table');
  return 'Importing · ' + (parts.join(' · ') || 'starting');
}

/**
 * A finished run in DataImportPage's result shape, or the error it ended
 * with. `run` is GET /runs/:id once its status is no longer 'running'.
 */
export function runResults(run) {
  if (run.status === 'error') throw new Error(run.error || 'The import failed');
  if (run.status === 'stopped') throw new Error(run.error === 'Stopped' || !run.error ? 'The import was stopped.' : run.error);
  return ((run.result && run.result.results) || []).map(function(r) {
    return {
      part: r.sheet, target: r.targetTable, success: r.success, rows: r.rows, error: r.error,
      dropped: r.dropped || 0, jobId: r.jobId || null,
      note: r.recovered ? Number(r.recovered).toLocaleString() + ' of them recovered from cells they had been pasted into' : null
    };
  });
}

/** A history row in ImportHistoryPage's shape. */
export function historyJob(row) {
  return {
    id: row.id, originalFileName: row.originalFileName, part: row.part, target: row.targetTable,
    destination: row.destination, rows: row.totalRows, rowsLoaded: row.rowsLoaded, rowsDropped: row.rowsDropped,
    mode: row.mode, status: row.status, startedAt: row.startedAt, error: row.errorMessage, createdByName: row.createdByName
  };
}

/** The databases of the chosen connection, for the second picker. */
export function databasesOf(targets, connectionId) {
  var t = (targets || []).filter(function(x) { return x.connectionId === connectionId; })[0];
  return (t && t.databases) || [];
}
