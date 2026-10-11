import { useEffect } from 'react';
import './dataImport.css';
import { XeplrTable } from '@xeplr/ui-table';

/**
 * The rows an import dropped, in a dialog: each with its place in the file and
 * why the database refused it, and Copy / Download to fix and import again.
 * Presentation only — everything comes from useDroppedRowsController.
 *
 * Required (DROPPED_ROWS_RULES): #xeplr-dropped-rows-copy, #xeplr-dropped-rows-download,
 * #xeplr-dropped-rows-close.
 */
export default function DroppedRowsSample({
  job, table, summary, loading, error, copied, downloading, canCopy, canDownload, copy, download, close
}) {
  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') close(); }
    window.addEventListener('keydown', onKey);
    return function() { window.removeEventListener('keydown', onKey); };
  }, [close]);

  if (!job) return null;
  var schema = table ? { 0: { columns: table.columns.map(function(c) {
    return { accessor: c.key, header: c.header, cell: c.key === 'reason'
      ? function(info) { return <span className="xeplr-data-import-dropped-reason">{info.getValue()}</span>; }
      : undefined };
  }) } } : null;

  return (
    <div className="xeplr-data-import-dropped-backdrop" onMouseDown={function(e) { if (e.target === e.currentTarget) close(); }}>
      <div className="xeplr-data-import-dropped" role="dialog" aria-modal="true" aria-label={summary ? summary.heading : 'Dropped rows'}>
        <div className="xeplr-data-import-dropped-head">
          <h3 className="xeplr-data-import-dropped-title">{summary && summary.heading}</h3>
          <p className="xeplr-data-import-hint">
            The database refused these rows, so they are not in the table. Copy or download them, fix them, and import them again — the
            file has the same columns as yours.
          </p>
        </div>

        {summary && summary.note && <div className="xeplr-data-import-dropped-note">{summary.note}</div>}
        {error && <div className="xeplr-data-import-alert xeplr-data-import-alert-error">{error}</div>}
        {loading && <p className="xeplr-data-import-hint">Loading the dropped rows…</p>}

        {table && table.rows.length > 0 && (
          <div className="xeplr-data-import-dropped-table">
            <XeplrTable data={table.rows} schema={schema} pageSize={50} />
          </div>
        )}

        <div className="xeplr-data-import-dropped-actions">
          <button id="xeplr-dropped-rows-copy" type="button" className="xeplr-data-import-button"
            disabled={!canCopy} onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button id="xeplr-dropped-rows-download" type="button" className="xeplr-data-import-button xeplr-data-import-button-primary"
            disabled={!canDownload || downloading} onClick={download}>
            {downloading ? 'Downloading…' : 'Download Excel'}
          </button>
          <span className="xeplr-data-import-dropped-spacer" />
          <button id="xeplr-dropped-rows-close" type="button" className="xeplr-data-import-button" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
