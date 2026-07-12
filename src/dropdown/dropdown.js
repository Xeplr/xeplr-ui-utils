/**
 * Dropdown — pure model. No React.
 *
 * Two sources:
 *   - 'static'  → caller passes `options` directly
 *   - 'dynamic' → caller passes `fetchData` (returns Promise<Array>)
 *
 * Two modes: 'single' or 'multi'.
 *
 * Items default to { id, name }. Other shapes are supported via the `keys`
 * prop, an array where keys[0] is the id field, keys[1] is the display name
 * (also used for sort + search), and the remainder are "extra" fields shown
 * as metadata in each row (also searchable).
 */

export var DROPDOWN_MODES = ['single', 'multi'];

/**
 * Turn a `keys` array (or undefined) into a structured shape.
 * keys[0] = id, keys[1] = name, keys[2..] = extras.
 */
export function normalizeKeys(keys) {
  var arr = Array.isArray(keys) && keys.length >= 2 ? keys : ['id', 'name'];
  return {
    id: arr[0],
    name: arr[1],
    extras: arr.slice(2)
  };
}

/**
 * Sort items ascending by the named key, case-insensitive for strings.
 */
export function sortByKey(items, key) {
  if (!Array.isArray(items)) return [];
  var copy = items.slice();
  copy.sort(function(a, b) {
    var av = a == null ? '' : a[key];
    var bv = b == null ? '' : b[key];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return copy;
}

/**
 * Filter items where any of `searchKeys` contains `query` (case-insensitive).
 * Empty query returns all items.
 */
export function filterByQuery(items, query, searchKeys) {
  if (!query) return items;
  var q = String(query).toLowerCase();
  return items.filter(function(item) {
    for (var i = 0; i < searchKeys.length; i++) {
      var v = item[searchKeys[i]];
      if (v != null && String(v).toLowerCase().indexOf(q) !== -1) return true;
    }
    return false;
  });
}

/**
 * Find items whose ids match the given selection.
 * `selection` is an array of ids; returns an array of items in the same order
 * as the master list (preserves stability across reorders).
 */
export function pickSelected(items, selection, idKey) {
  if (!selection || selection.length === 0) return [];
  var set = {};
  for (var i = 0; i < selection.length; i++) set[selection[i]] = true;
  return items.filter(function(item) { return set[item[idKey]]; });
}
