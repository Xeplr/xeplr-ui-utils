import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  DROPDOWN_MODES,
  normalizeKeys,
  sortByKey,
  filterByQuery,
  pickSelected
} from './dropdown.js';

/**
 * @param {object} props
 * @param {'single'|'multi'} [props.mode='single']
 * @param {Array} [props.options]                 — static items
 * @param {() => Promise<Array>} [props.fetchData] — dynamic loader
 * @param {Array<string>} [props.keys]            — [idKey, nameKey, ...extraKeys]; default ['id','name']
 * @param {*} [props.value]                       — controlled selection (id, or id[])
 * @param {*} [props.defaultValue]                — uncontrolled initial selection
 * @param {(value, items) => void} [props.onChange]
 * @param {string} [props.placeholder='Select…']
 * @param {boolean} [props.searchable=true]
 * @param {boolean} [props.disabled]
 */
export function useDropdownController(props) {
  props = props || {};
  var mode = props.mode || 'single';
  if (DROPDOWN_MODES.indexOf(mode) === -1) {
    throw new Error('[xeplr-ui-utils:Dropdown] Unknown mode: ' + mode + '. Expected one of ' + DROPDOWN_MODES.join(', '));
  }

  var keys = useMemo(function() { return normalizeKeys(props.keys); }, [props.keys]);
  var source = props.fetchData ? 'dynamic' : 'static';
  var searchable = props.searchable !== false;

  var [dynamicItems, setDynamicItems] = useState([]);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [query, setQuery] = useState('');
  var [isOpen, setIsOpen] = useState(false);

  var isControlled = props.value !== undefined;
  var initialSelection = useMemo(function() {
    var v = isControlled ? props.value : props.defaultValue;
    if (v === undefined || v === null) return [];
    return Array.isArray(v) ? v.slice() : [v];
  }, [isControlled, props.value, props.defaultValue]);

  var [selection, setSelection] = useState(initialSelection);

  useEffect(function() {
    if (isControlled) {
      var v = props.value;
      setSelection(v === null || v === undefined ? [] : (Array.isArray(v) ? v.slice() : [v]));
    }
  }, [isControlled, props.value]);

  // Static items are derived (no state — avoids re-render loops if caller
  // passes a new `options` array reference each render). Dynamic items come
  // from the fetch effect below.
  var items = useMemo(function() {
    if (source === 'static') return sortByKey(props.options || [], keys.name);
    return dynamicItems;
  }, [source, props.options, dynamicItems, keys.name]);

  // Load dynamic data on mount.
  var fetchedRef = useRef(false);
  useEffect(function() {
    if (source !== 'dynamic' || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError('');
    Promise.resolve()
      .then(function() { return props.fetchData(); })
      .then(function(data) {
        setDynamicItems(sortByKey(Array.isArray(data) ? data : [], keys.name));
      })
      .catch(function(err) {
        setError(err && err.message ? err.message : 'Failed to load options');
      })
      .finally(function() {
        setLoading(false);
      });
  }, [source]);

  function refresh() {
    if (source !== 'dynamic') return;
    setLoading(true);
    setError('');
    Promise.resolve()
      .then(function() { return props.fetchData(); })
      .then(function(data) {
        setDynamicItems(sortByKey(Array.isArray(data) ? data : [], keys.name));
      })
      .catch(function(err) {
        setError(err && err.message ? err.message : 'Failed to load options');
      })
      .finally(function() {
        setLoading(false);
      });
  }

  var searchKeys = useMemo(function() {
    return [keys.name].concat(keys.extras);
  }, [keys]);

  var filteredItems = useMemo(function() {
    return filterByQuery(items, query, searchKeys);
  }, [items, query, searchKeys]);

  var selectedItems = useMemo(function() {
    return pickSelected(items, selection, keys.id);
  }, [items, selection, keys.id]);

  function open() { if (!props.disabled) setIsOpen(true); }
  function close() { setIsOpen(false); setQuery(''); }
  function toggle() { isOpen ? close() : open(); }

  function emit(nextSelection) {
    var nextItems = pickSelected(items, nextSelection, keys.id);
    if (props.onChange) {
      props.onChange(mode === 'single' ? (nextSelection[0] || null) : nextSelection, nextItems);
    }
  }

  function selectItem(itemId) {
    var next;
    if (mode === 'single') {
      next = [itemId];
      if (!isControlled) setSelection(next);
      emit(next);
      close();
      return;
    }
    var has = selection.indexOf(itemId) !== -1;
    next = has ? selection.filter(function(id) { return id !== itemId; }) : selection.concat(itemId);
    if (!isControlled) setSelection(next);
    emit(next);
  }

  function removeSelection(itemId) {
    var next = selection.filter(function(id) { return id !== itemId; });
    if (!isControlled) setSelection(next);
    emit(next);
  }

  function clearSelection() {
    if (!isControlled) setSelection([]);
    emit([]);
  }

  function handleSearch(e) {
    setQuery(e.target.value);
  }

  // Click-outside support — design wires this onto its container ref.
  var rootRef = useRef(null);
  useEffect(function() {
    if (!isOpen) return;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return function() { document.removeEventListener('mousedown', onDocClick); };
  }, [isOpen]);

  var isSelected = useCallback(function(itemId) {
    return selection.indexOf(itemId) !== -1;
  }, [selection]);

  return {
    mode,
    source,
    keys,
    searchable,
    placeholder: props.placeholder || 'Select…',
    disabled: !!props.disabled,
    items,
    filteredItems,
    selectedItems,
    selection,
    loading,
    error,
    query,
    isOpen,
    rootRef,
    isSelected,
    open,
    close,
    toggle,
    selectItem,
    removeSelection,
    clearSelection,
    handleSearch,
    refresh
  };
}
