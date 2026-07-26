import './dataImport.css';
import { XeplrTable } from '@xeplr/ui-table';
import { raiseConfirm } from '../../confirm/confirm.js';

var STATUS_LABEL = {
  completed: 'Completed',
  failed: 'Failed',
  'rolled-back': 'Rolled back'
};

function formatWhen(value) {
  if (!value) return '';
  var d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

var SCHEMA = {
  0: {
    columns: [
      {
        accessor: 'originalFileName',
        header: 'File',
        cell: function(info) {
          var job = info.row.original;
          return job.originalFileName + (job.part ? ' (' + job.part + ')' : '');
        }
      },
      {
        accessor: 'destination',
        header: 'Destination',
        cell: function(info) { return info.getValue() || '—'; }
      },
      { accessor: 'target', header: 'Target' },
      {
        accessor: 'rows',
        header: 'Rows',
        cell: function(info) {
          var job = info.row.original;
          var total = info.getValue();
          if (total == null) return '—';
          if (job.rowsLoaded != null || job.rowsDropped != null) {
            var loaded = job.rowsLoaded != null ? job.rowsLoaded : total;
            var dropped = job.rowsDropped || 0;
            return total + (dropped > 0 ? ' (' + loaded + ' loaded, ' + dropped + ' dropped)' : '');
          }
          return total;
        }
      },
      {
        accessor: 'status',
        header: 'Status',
        cell: function(info) {
          var job = info.row.original;
          return (
            <span>
              <span className={'xeplr-import-history-status xeplr-import-history-status-' + job.status}>
                {STATUS_LABEL[job.status] || job.status}
              </span>
              {job.status === 'failed' && job.error && (
                <span className="xeplr-import-history-error"> — {job.error}</span>
              )}
            </span>
          );
        }
      },
      {
        accessor: 'startedAt',
        header: 'When',
        cell: function(info) { return formatWhen(info.getValue()); }
      },
      {
        accessor: 'createdByName',
        header: 'Created By',
        cell: function(info) { return info.getValue() || '—'; }
      }
    ]
  }
};

export default function ImportHistorySample({ jobs, loading, error, rollingBackId, deletingId, handleRollback, handleDelete }) {
  async function onRollbackClick(job) {
    var ok = await raiseConfirm(
      'This deletes every row loaded into "' + job.target + '" by this import. This cannot be undone.',
      { title: 'Rollback this import?', confirmLabel: 'Rollback', danger: true }
    );
    if (ok) handleRollback(job);
  }

  async function onDeleteClick(job) {
    var message = job.status === 'completed'
      ? 'This removes the history record only — it does NOT undo the data loaded into "' + job.target + '". Roll back first if you need to remove that data; once this record is deleted, you won\'t be able to roll it back. This cannot be undone.'
      : 'This removes the history record for this import. This cannot be undone.';
    var ok = await raiseConfirm(message, { title: 'Delete this import record?', confirmLabel: 'Delete', danger: true });
    if (ok) handleDelete(job);
  }

  var rowActions = [
    {
      key: 'rollback',
      label: 'Rollback',
      variant: 'danger',
      visible: function(job) { return job.status === 'completed'; },
      disabled: function(job) { return rollingBackId === job.id; },
      onClick: onRollbackClick
    },
    {
      key: 'delete',
      label: 'Delete',
      variant: 'danger',
      disabled: function(job) { return deletingId === job.id; },
      onClick: onDeleteClick
    }
  ];

  return (
    <div className="xeplr-import-history">
      {loading && <p className="xeplr-data-import-hint">Loading import history…</p>}
      {error && <div className="xeplr-data-import-alert xeplr-data-import-alert-error">{error}</div>}

      {!loading && jobs.length === 0 && !error && (
        <p className="xeplr-data-import-hint">No imports yet.</p>
      )}

      {jobs.length > 0 && (
        <XeplrTable data={jobs} schema={SCHEMA} rowActions={rowActions} pageSize={20} />
      )}
    </div>
  );
}
