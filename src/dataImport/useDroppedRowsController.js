import { useCallback, useEffect, useRef, useState } from 'react';
import { droppedAsTsv, droppedCount, droppedSummary, droppedTable } from './droppedRows.js';

/**
 * The rows an import dropped: open them, copy them, download them.
 *
 * @param {object} options
 * @param {(job) => Promise<{columns, rows, total, dropped}>} [options.onLoadDropped]
 *        the app's read of a job's dropped rows. Without it nothing offers to show them.
 * @param {(job) => Promise<any>} [options.onDownloadDropped]
 *        the app saves them as a file (an .xlsx that imports again as it is)
 *
 * job: { id, rowsDropped|dropped, originalFileName?, part?, target? } — an
 * import-history row, or an import result with its jobId as id.
 */
export function useDroppedRowsController(options = {}) {
  var [job, setJob] = useState(null);
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [copied, setCopied] = useState(false);
  var [downloading, setDownloading] = useState(false);
  var copiedTimer = useRef(null);
  var onLoad = options.onLoadDropped;

  useEffect(function() { return function() { clearTimeout(copiedTimer.current); }; }, []);

  var canView = useCallback(function(j) {
    return !!onLoad && !!j && j.id != null && droppedCount(j) > 0;
  }, [onLoad]);

  var open = useCallback(async function(j) {
    setJob(j);
    setData(null);
    setError('');
    setCopied(false);
    setLoading(true);
    try {
      setData(await onLoad(j));
    } catch (err) {
      setError(err.message || 'Could not load the dropped rows');
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  function close() {
    setJob(null);
    setData(null);
    setError('');
  }

  async function copy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(droppedAsTsv(data));
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(function() { setCopied(false); }, 2000);
    } catch (err) {
      setError('Could not copy — the browser refused the clipboard. Use Download instead.');
    }
  }

  async function download() {
    if (!options.onDownloadDropped || !job) return;
    setDownloading(true);
    setError('');
    try {
      await options.onDownloadDropped(job);
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  return {
    job: job,
    data: data,
    table: data ? droppedTable(data) : null,
    summary: job ? droppedSummary(job, data) : null,
    loading: loading,
    error: error,
    copied: copied,
    downloading: downloading,
    canDownload: !!options.onDownloadDropped && !!data && data.total > 0,
    canCopy: !!data && data.rows && data.rows.length > 0,
    canView: canView,
    open: open,
    close: close,
    copy: copy,
    download: download
  };
}
