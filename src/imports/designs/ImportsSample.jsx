import { useEffect, useState } from 'react';
import './imports.css';

/**
 * The import screen: which database, the import, and the history. Presentation
 * only — everything comes from useImportsController; the import and history
 * sections arrive as elements (ImportsPage passes DataImportPage and
 * ImportHistoryPage), so a custom design can place them anywhere.
 *
 * Required (IMPORTS_RULES): #xeplr-imports-connection, #xeplr-imports-database.
 */
export default function ImportsSample({
  targets, targetsError, connectionId, dbInfoId, databases, chooseConnection, chooseDatabase,
  importing, progressText, stop, importSection, historySection
}) {
  return (
    <div className="xeplr-imports">
      <section className="xeplr-imports-card">
        <h2 className="xeplr-imports-title">1. Choose a database</h2>
        <p className="xeplr-imports-hint">The file is loaded into a table in this database.</p>
        {targetsError && <div className="xeplr-imports-error">{targetsError}</div>}
        {!targetsError && targets.length === 0 && <p className="xeplr-imports-hint">There is no database to import into yet.</p>}
        <div className="xeplr-imports-pickers">
          <label className="xeplr-imports-field">
            <span>Connection</span>
            <select id="xeplr-imports-connection" value={connectionId} disabled={!!importing}
              onChange={function(e) { chooseConnection(e.target.value); }}>
              {targets.map(function(t) { return <option key={t.connectionId} value={t.connectionId}>{t.label}</option>; })}
            </select>
          </label>
          <label className="xeplr-imports-field">
            <span>Database</span>
            <select id="xeplr-imports-database" value={dbInfoId} disabled={!!importing}
              onChange={function(e) { chooseDatabase(e.target.value); }}>
              {databases.map(function(d) { return <option key={d.id} value={d.id}>{d.label}</option>; })}
            </select>
          </label>
        </div>
      </section>

      <section className="xeplr-imports-card">
        <h2 className="xeplr-imports-title">2. Upload &amp; map</h2>
        <p className="xeplr-imports-hint">Excel files let you load each sheet into its own table.</p>
        {importing && (
          <p className="xeplr-imports-progress">
            {progressText}
            <RunClock startedAt={importing.startedAt} />
            <button type="button" className="xeplr-imports-stop" title="Stop this import" onClick={stop}>✕</button>
          </p>
        )}
        {importSection}
      </section>

      <section className="xeplr-imports-card">
        <h2 className="xeplr-imports-title">Import history</h2>
        <p className="xeplr-imports-hint">Past imports — roll one back if it loaded the wrong data, see the rows it dropped, or delete the record.</p>
        {historySection}
      </section>
    </div>
  );
}

/** "12 s", "3 min 4 s" — how long the import has been running. */
function RunClock({ startedAt }) {
  var [now, setNow] = useState(Date.now());
  useEffect(function() {
    var t = setInterval(function() { setNow(Date.now()); }, 1000);
    return function() { clearInterval(t); };
  }, []);
  var s = Math.max(0, Math.round((now - startedAt) / 1000));
  return <span className="xeplr-imports-clock">{s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s'}</span>;
}
