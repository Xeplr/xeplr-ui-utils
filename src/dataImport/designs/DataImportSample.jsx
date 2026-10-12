import './dataImport.css';

export default function DataImportSample({
  file, inspecting, uploadPercent, inspected, mappings, committing, results, error,
  handleFileChange, updateMapping, setFix, checksOf, handleCommit, reset, accept, targetLabel,
  canViewDropped, viewDropped, modes, setMode, problems, checking, blocked
}) {
  return (
    <div className="xeplr-data-import">
      <label className="xeplr-data-import-dropzone">
        {/* Cleared on each pick, so choosing the same file again — fixed and
            saved under its old name — is a new pick, not nothing. */}
        <input type="file" accept={accept} onChange={handleFileChange}
          onClick={function(e) { e.currentTarget.value = ''; }} />
        {file ? file.name : 'Choose a file to import'}
      </label>

      {inspecting && (
        <p className="xeplr-data-import-hint">
          {uploadPercent != null && uploadPercent < 100 ? 'Uploading the file… ' + uploadPercent + '%' : 'Inspecting file…'}
        </p>
      )}
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
                {/* What the import does to the table: make it, add to it, or
                    replace its rows. */}
                {modes && (
                  <div className="xeplr-data-import-mode" role="radiogroup" aria-label="What to do with the table">
                    {modes.map(function(mode) {
                      var on = m.mode === mode.key;
                      return (
                        <button key={mode.key} type="button" role="radio" aria-checked={on} disabled={!m.include}
                          className={'xeplr-data-import-mode-option' + (on ? ' xeplr-data-import-mode-option-on' : '')}
                          onClick={function() { setMode(i, mode.key); }}>
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* What will happen to that table, said before anything loads. */}
                {problems && (problems[i] || []).length > 0 && (
                  <ul className="xeplr-data-import-target">
                    {problems[i].map(function(p, pi) {
                      return <li key={pi} className={'xeplr-data-import-target-' + p.level}>{p.message}</li>;
                    })}
                  </ul>
                )}
                {/* What the inspect step found, before anything is loaded —
                    and the fix, when one is offered, as a choice. */}
                {(checksOf ? checksOf(m.part) : []).map(function(c) {
                  return (
                    <div key={c.key} className="xeplr-data-import-check" role="alert">
                      <p className="xeplr-data-import-check-message">{c.message}</p>
                      {c.fixLabel && (
                        <label className="xeplr-data-import-check-fix">
                          <input
                            type="checkbox"
                            checked={Boolean(m.fixes && m.fixes[c.key])}
                            disabled={!m.include}
                            onChange={function(e) { setFix(i, c.key, e.target.checked); }}
                          />
                          {c.fixLabel}
                        </label>
                      )}
                      {(c.examples || []).length > 0 && (
                        <ul className="xeplr-data-import-check-examples">
                          {c.examples.map(function(x, xi) { return <li key={xi}>{x}</li>; })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {inspected && mappings.length > 0 && (
        <div className="xeplr-data-import-actions">
          <button type="button" onClick={handleCommit}
            disabled={committing || checking || blocked || !mappings.some(function(m) { return m.include; })}>
            {committing ? 'Importing…' : checking ? 'Checking the table…' : 'Import'}
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
                {r.note && <span className="xeplr-data-import-result-note">{r.note}</span>}
                {r.success && r.dropped > 0 && (
                  <span className="xeplr-data-import-result-dropped">
                    {r.dropped.toLocaleString()} dropped
                    {canViewDropped && canViewDropped({ id: r.jobId, dropped: r.dropped }) && (
                      <>
                        {' — '}
                        <button type="button" className="xeplr-data-import-link" onClick={function() {
                          viewDropped({ id: r.jobId, dropped: r.dropped, originalFileName: file && file.name, part: r.part, target: r.target });
                        }}>View</button>
                      </>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
