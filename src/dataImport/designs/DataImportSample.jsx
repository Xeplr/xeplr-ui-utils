import './dataImport.css';

export default function DataImportSample({
  file, inspecting, inspected, mappings, committing, results, error,
  handleFileChange, updateMapping, handleCommit, reset, accept, targetLabel
}) {
  return (
    <div className="xeplr-data-import">
      <label className="xeplr-data-import-dropzone">
        <input type="file" accept={accept} onChange={handleFileChange} />
        {file ? file.name : 'Choose a file to import'}
      </label>

      {inspecting && <p className="xeplr-data-import-hint">Inspecting file…</p>}
      {error && <div className="xeplr-data-import-alert xeplr-data-import-alert-error">{error}</div>}

      {inspected && mappings.length > 0 && (
        <div className="xeplr-data-import-mappings">
          {mappings.map(function(m, i) {
            return (
              <div key={m.part || 'single'} className="xeplr-data-import-mapping-row">
                {m.part && (
                  <label className="xeplr-data-import-mapping-check">
                    <input
                      type="checkbox"
                      checked={m.include}
                      onChange={function(e) { updateMapping(i, { include: e.target.checked }); }}
                    />
                    {m.part}
                  </label>
                )}
                <span className="xeplr-data-import-mapping-arrow">&rarr;</span>
                <input
                  type="text"
                  value={m.target}
                  disabled={!m.include}
                  onChange={function(e) { updateMapping(i, { target: e.target.value }); }}
                  placeholder={targetLabel}
                />
              </div>
            );
          })}
        </div>
      )}

      {inspected && mappings.length > 0 && (
        <div className="xeplr-data-import-actions">
          <button type="button" onClick={handleCommit} disabled={committing || !mappings.some(function(m) { return m.include; })}>
            {committing ? 'Importing…' : 'Import'}
          </button>
          <button type="button" onClick={reset} disabled={committing}>Cancel</button>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="xeplr-data-import-results">
          {results.map(function(r, i) {
            return (
              <div key={i} className="xeplr-data-import-result-row">
                <span>{r.target}{r.part ? ' (' + r.part + ')' : ''}</span>
                <span className={r.success ? 'xeplr-data-import-result-ok' : 'xeplr-data-import-result-fail'}>
                  {r.success ? (r.rows != null ? r.rows + ' rows' : 'Done') : (r.error || 'Failed')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
