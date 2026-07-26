import { useState, useMemo } from 'react';
import { filterRows, sortRows } from './gridDisplayer.js';

// Module-level (not recreated per render) — used as fallbacks below so a
// caller that omits rows/searchFields/sortFields doesn't hand displayRows'
// useMemo a fresh array identity every render, which would defeat the memo.
var DEFAULT_ROWS = [];
var DEFAULT_SEARCH_FIELDS = ['name'];
// Each sortFields entry is a fully-resolved sort choice — field + direction
// + label combined into one dropdown option (e.g. "Name (A-Z)") rather than
// a bare field name paired with a separate asc/desc toggle button. One
// dropdown, no extra icon button to keep clean.
var DEFAULT_SORT_FIELDS = [{ value: 'name_asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' }];

/**
 * @param {object} props
 * @param {Array<object>} props.rows
 * @param {*} props.tileFormatComponent - component rendering a tile's CONTENT only
 *   (the design owns the clickable/hover-zoom wrapper around it) — receives
 *   { row } for a normal tile, or { isAddTile: true } for the leading "add new"
 *   tile (only rendered when props.onAddNew is supplied).
 * @param {Array<string>} [props.searchFields=['name']] - row fields the search box matches
 * @param {Array<{value:string, label:string, field:string, direction:'asc'|'desc'}>} [props.sortFields]
 *   - default: [{value:'name_asc', label:'Name (A-Z)', field:'name', direction:'asc'}]
 * @param {(row:object)=>void} [props.onSelect] - tile click (non-add tile)
 * @param {()=>void} [props.onAddNew] - if provided, a leading "add new" tile renders
 */
export function useGridDisplayerController(props) {
  props = props || {};
  var rows = props.rows || DEFAULT_ROWS;
  var searchFields = props.searchFields || DEFAULT_SEARCH_FIELDS;
  var sortFields = props.sortFields || DEFAULT_SORT_FIELDS;

  var [query, setQuery] = useState('');
  var [sortValue, setSortValue] = useState(sortFields[0] ? sortFields[0].value : null);

  var activeSort = null;
  for (var i = 0; i < sortFields.length; i++) {
    if (sortFields[i].value === sortValue) { activeSort = sortFields[i]; break; }
  }
  if (!activeSort) activeSort = sortFields[0] || null;

  var displayRows = useMemo(function() {
    var filtered = filterRows(rows, query, searchFields);
    return sortRows(filtered, activeSort ? activeSort.field : null, activeSort ? activeSort.direction : 'asc');
  }, [rows, query, searchFields, activeSort]);

  return {
    query: query,
    setQuery: setQuery,
    sortFields: sortFields,
    sortValue: activeSort ? activeSort.value : null,
    setSortValue: setSortValue,
    displayRows: displayRows,
    tileFormatComponent: props.tileFormatComponent,
    onSelect: props.onSelect,
    onAddNew: props.onAddNew
  };
}
