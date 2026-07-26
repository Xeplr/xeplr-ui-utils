import { useCallback, useEffect, useState } from 'react';

/**
 * @param {object} options
 * @param {() => Promise<{jobs: object[]}|object[]>} options.onList
 * @param {(job: object) => Promise<any>} options.onRollback
 * @param {(job: object) => Promise<any>} [options.onDelete]
 *
 * Job shape (generic — same part/target vocabulary as useDataImportController):
 *   { id, originalFileName, part, target, rows, status, startedAt, error,
 *     destination?, rowsLoaded?, rowsDropped?, createdByName? }
 * status: 'completed' | 'failed' | 'rolled-back' — only 'completed' rows are
 * rollback-able; the design decides how to render the others.
 * The `?` fields are optional context (where it went beyond the target table,
 * a loaded/dropped breakdown, who ran it) — apps that don't track them can
 * omit them and the design falls back to '—'.
 */
export function useImportHistoryController(options = {}) {
  var [jobs, setJobs] = useState([]);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [rollingBackId, setRollingBackId] = useState(null);
  var [deletingId, setDeletingId] = useState(null);

  var load = useCallback(async function() {
    setLoading(true);
    setError('');
    try {
      var res = await options.onList();
      setJobs((res && res.jobs) || res || []);
    } catch (err) {
      setError(err.message || 'Failed to load import history');
    } finally {
      setLoading(false);
    }
  }, [options.onList]);

  useEffect(function() { load(); }, [load]);

  async function handleRollback(job) {
    setRollingBackId(job.id);
    setError('');
    try {
      await options.onRollback(job);
      await load();
    } catch (err) {
      setError(err.message || 'Rollback failed');
    } finally {
      setRollingBackId(null);
    }
  }

  async function handleDelete(job) {
    setDeletingId(job.id);
    setError('');
    try {
      await options.onDelete(job);
      await load();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return { jobs, loading, error, rollingBackId, deletingId, reload: load, handleRollback, handleDelete };
}
