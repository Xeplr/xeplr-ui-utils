// IMPORTS — model. The calls @xeplr/imports' routes answer, and the pure
// helpers the page needs. No React; fetch and XMLHttpRequest only.
//
// basePath is where the app mounted the router as the browser sees it —
// '/imports', or '/api/imports' behind a proxy prefix. Requests carry the
// headers configureUpload was given (uploadHeaders): sign-in and tenancy.

import { uploadFile, uploadHeaders } from '../fileUpload/uploadFile.js';

/** The import routes under one base path. Every call rejects with the server's own `error`. */
export function createImportsApi(basePath) {
  var base = String(basePath || '/imports').replace(/\/+$/, '');

  async function call(method, path, body) {
    var headers = uploadHeaders();
    if (body) headers['content-type'] = 'application/json';
    var res = await fetch(base + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
    var data = await res.json().catch(function() { return {}; });
    if (!res.ok) throw new Error(data.error || ('The request failed (' + res.status + ')'));
    return data;
  }

  return {
    upload: function(file, onProgress) { return uploadFile(file, { url: base + '/files', onProgress: onProgress }); },
    inspect: function(filePath) { return call('POST', '/inspect', { filePath: filePath }); },
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
      var res = await fetch(base + '/history/' + encodeURIComponent(id) + '/dropped/file', { headers: uploadHeaders() });
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
