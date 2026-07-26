/**
 * GridDisplayer — pure model. No React.
 * Client-side search + sort over a plain `rows` array, same philosophy as
 * CrudDisplayer/Dropdown — no fetch function, no server round-trip.
 */

/**
 * Substring match (case-insensitive) across `searchFields`. A field whose
 * value is an array (e.g. tags) matches if ANY entry contains the query.
 */
export function filterRows(rows, query, searchFields) {
  if (!query) return rows || [];
  var q = String(query).toLowerCase();
  return (rows || []).filter(function(row) {
    for (var i = 0; i < searchFields.length; i++) {
      var value = row[searchFields[i]];
      if (value == null) continue;
      if (Array.isArray(value)) {
        if (value.some(function(v) { return String(v).toLowerCase().indexOf(q) !== -1; })) return true;
      } else if (String(value).toLowerCase().indexOf(q) !== -1) {
        return true;
      }
    }
    return false;
  });
}

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
}

export function sortRows(rows, field, direction) {
  if (!field) return rows || [];
  var copy = (rows || []).slice();
  copy.sort(function(a, b) {
    var result = compareValues(a[field], b[field]);
    return direction === 'desc' ? -result : result;
  });
  return copy;
}
