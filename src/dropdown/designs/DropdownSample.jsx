import './dropdown.css';

function initials(name) {
  if (!name) return '·';
  var parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map(function(p) { return p.charAt(0).toUpperCase(); }).join('');
}

function joinExtras(item, extras) {
  var bits = [];
  for (var i = 0; i < extras.length; i++) {
    var v = item[extras[i]];
    if (v != null && v !== '') bits.push(String(v));
  }
  return bits.join(' · ');
}

function summary(selectedItems, mode, keys, placeholder) {
  if (selectedItems.length === 0) return <span className="xeplr-dropdown-placeholder">{placeholder}</span>;
  if (mode === 'single') {
    return <span className="xeplr-dropdown-selected-single">{selectedItems[0][keys.name]}</span>;
  }
  var first = selectedItems[0][keys.name];
  var more = selectedItems.length - 1;
  return (
    <span className="xeplr-dropdown-selected-multi">
      {first}{more > 0 ? <span className="xeplr-dropdown-selected-more"> +{more}</span> : null}
    </span>
  );
}

export default function DropdownSample({
  mode, keys, searchable, placeholder, disabled,
  filteredItems, selectedItems, loading, error, query, isOpen, rootRef,
  isSelected, toggle, selectItem, removeSelection, clearSelection, handleSearch,
  canCreate, createLabel, creating, createError, createItem
}) {
  var hasSelection = selectedItems.length > 0;
  var trimmedQuery = (query || '').trim();
  var exactMatch = filteredItems.some(function(item) {
    return String(item[keys.name]).toLowerCase() === trimmedQuery.toLowerCase();
  });
  var showCreate = canCreate && trimmedQuery && !exactMatch;

  return (
    <div
      ref={rootRef}
      className={'xeplr-dropdown xeplr-dropdown-' + mode + (isOpen ? ' xeplr-dropdown-open' : '') + (disabled ? ' xeplr-dropdown-disabled' : '')}
    >
      <div
        className="xeplr-dropdown-trigger"
        role="combobox"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        {mode === 'multi' && hasSelection ? (
          <div className="xeplr-dropdown-chips">
            {selectedItems.map(function(item) {
              return (
                <span key={item[keys.id]} className="xeplr-dropdown-chip">
                  {item[keys.name]}
                  <span
                    className="xeplr-dropdown-chip-x"
                    onClick={function(e) { e.stopPropagation(); removeSelection(item[keys.id]); }}
                  >×</span>
                </span>
              );
            })}
          </div>
        ) : summary(selectedItems, mode, keys, placeholder)}
        <span className="xeplr-dropdown-caret">⌄</span>
      </div>

      <div
        className={'xeplr-dropdown-panel' + (isOpen ? ' xeplr-dropdown-panel-open' : '')}
        role="listbox"
      >
        {searchable && (
          <div className="xeplr-dropdown-search">
            <input
              autoFocus
              className="xeplr-dropdown-search-input"
              placeholder="Search…"
              value={query}
              onChange={handleSearch}
            />
          </div>
        )}

        {loading && <div className="xeplr-dropdown-state">Loading…</div>}
        {error && <div className="xeplr-dropdown-state xeplr-dropdown-state-error">{error}</div>}

        {!loading && !error && filteredItems.length === 0 && !showCreate && (
          <div className="xeplr-dropdown-state">
            {canCreate && !trimmedQuery ? 'Type a name to add' : 'No matches'}
          </div>
        )}

        {!loading && !error && filteredItems.map(function(item) {
          var selected = isSelected(item[keys.id]);
          var meta = joinExtras(item, keys.extras);
          return (
            <div
              key={item[keys.id]}
              role="option"
              aria-selected={selected}
              className={'xeplr-dropdown-row' + (selected ? ' xeplr-dropdown-row-selected' : '')}
              onClick={function() { selectItem(item[keys.id]); }}
            >
              {mode === 'multi' && (
                <span className={'xeplr-dropdown-check' + (selected ? ' xeplr-dropdown-check-on' : '')}>
                  {selected ? '✓' : ''}
                </span>
              )}
              <span className="xeplr-dropdown-avatar">{initials(item[keys.name])}</span>
              <span className="xeplr-dropdown-info">
                <span className="xeplr-dropdown-name">{item[keys.name]}</span>
                {meta && <span className="xeplr-dropdown-meta">{meta}</span>}
              </span>
            </div>
          );
        })}

        {showCreate && (
          <div
            role="option"
            className="xeplr-dropdown-row xeplr-dropdown-create"
            onClick={function() { if (!creating) createItem(); }}
          >
            <span className="xeplr-dropdown-avatar xeplr-dropdown-create-plus">＋</span>
            <span className="xeplr-dropdown-info">
              <span className="xeplr-dropdown-name">
                {creating ? 'Adding…' : (createLabel + ' “' + trimmedQuery + '”')}
              </span>
            </span>
          </div>
        )}

        {createError && (
          <div className="xeplr-dropdown-state xeplr-dropdown-state-error">{createError}</div>
        )}

        {hasSelection && (
          <div className="xeplr-dropdown-footer">
            <span className="xeplr-dropdown-clear" onClick={clearSelection}>Clear selection</span>
          </div>
        )}
      </div>
    </div>
  );
}
