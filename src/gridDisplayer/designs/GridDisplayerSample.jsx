import './gridDisplayer.css';

export default function GridDisplayerSample({
  query, setQuery,
  sortFields, sortValue, setSortValue,
  displayRows, tileFormatComponent, onSelect, onAddNew
}) {
  var TileFormatComponent = tileFormatComponent;

  return (
    <div className="xeplr-grid-displayer">
      <div className="xeplr-grid-toolbar">
        <input
          type="text"
          className="xeplr-grid-search"
          placeholder="Search…"
          value={query}
          onChange={function(e) { setQuery(e.target.value); }}
        />
        {sortFields.length > 0 && (
          <select
            className="xeplr-grid-sort-select"
            value={sortValue || ''}
            onChange={function(e) { setSortValue(e.target.value || null); }}
          >
            {sortFields.map(function(f) {
              return <option key={f.value} value={f.value}>{f.label}</option>;
            })}
          </select>
        )}
      </div>

      <div className="xeplr-grid">
        {onAddNew && (
          <div className="xeplr-grid-tile xeplr-grid-tile-add" onClick={onAddNew}>
            <TileFormatComponent isAddTile />
          </div>
        )}

        {displayRows.map(function(row) {
          return (
            <div
              key={row.id}
              className="xeplr-grid-tile"
              onClick={onSelect ? function() { onSelect(row); } : undefined}
            >
              <TileFormatComponent row={row} />
            </div>
          );
        })}

        {displayRows.length === 0 && !onAddNew && (
          <div className="xeplr-grid-empty">No matches</div>
        )}
      </div>
    </div>
  );
}
