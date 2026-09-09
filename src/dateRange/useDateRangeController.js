import { useEffect, useState } from 'react';
import { QUICK_PRESETS, parseSingleDate, dateValueLabel, singleDateSuggestions } from './dateRange.js';

/**
 * DateRange — controller. Owns which tab is open and the half-typed text; the
 * design draws it. No JSX here.
 *
 * @param {object} props
 * @param {object|null} props.value      - the current selection, or null
 * @param {Function} props.onChange      - (selection|null) => void
 * @param {Function} [props.onClose]     - called after a choice that ends the interaction
 * @param {Array} [props.presets]        - override the quick list
 * @param {boolean} [props.allowClear]   - default true. Set false where an
 *   empty selection is not a state the host can accept — a report bounded by
 *   a date, say, for which "no date" means scanning all of history.
 */
export function useDateRangeController(props) {
  var value = props.value || null;
  var onChange = props.onChange || function() {};
  var onClose = props.onClose;
  var presets = props.presets || QUICK_PRESETS;
  // Opt-OUT, so every existing caller keeps the button it already had.
  var allowClear = props.allowClear !== false;

  var initial = value && value.kind ? value.kind : 'quick';
  var tabState = useState(initial);
  var tab = tabState[0];
  var setTab = tabState[1];

  var singleState = useState(value && value.kind === 'single' ? value.value : '');
  var single = singleState[0];
  var setSingle = singleState[1];

  // A selection made elsewhere (a reset, a different record) has to show up
  // here, or the box keeps displaying what the user last typed into it.
  useEffect(function() {
    if (value && value.kind === 'single') setSingle(value.value || '');
  }, [value]);

  var range = value && value.kind === 'range' ? value : { from: '', to: '' };
  // Parsed as you type, so "May 202" reads as not-a-date-yet rather than
  // silently saving as nothing.
  var singleParsed = single ? parseSingleDate(single) : null;

  // WHAT YEAR TO OFFER FIRST — the one already on screen.
  //
  // Somebody typing "j" after looking at Feb 2025 is almost certainly after a
  // month of 2025. Read from what is COMMITTED rather than from what is being
  // typed, or the anchor would move as soon as a suggestion resolved to a
  // different year and the list would reorder under the cursor.
  var committed = value && value.kind === 'single' ? parseSingleDate(value.value) : null;
  var anchorYear = committed && committed.from
    ? Number(String(committed.from).slice(0, 4))
    : new Date().getFullYear();

  var suggestions = singleDateSuggestions(single, anchorYear);

  function applySuggestion(text) {
    setSingle(text);
    // COMMITTED IMMEDIATELY. Picking from a list is a decision — leaving it in
    // the box for the user to then press Enter on would be asking twice.
    if (parseSingleDate(text)) {
      onChange({ kind: 'single', value: text });
      if (onClose) onClose();
    }
  }

  function selectPreset(key) {
    onChange({ kind: 'quick', preset: key });
    if (onClose) onClose();
  }

  function setRangeFrom(from) {
    onChange({ kind: 'range', from: from, to: range.to || '' });
  }

  function setRangeTo(to) {
    onChange({ kind: 'range', from: range.from || '', to: to });
  }

  // Only committed once it parses — a partial entry must not overwrite a good
  // selection with nothing.
  function commitSingle(close) {
    if (!singleParsed) return;
    onChange({ kind: 'single', value: single.trim() });
    if (close && onClose) onClose();
  }

  function clear() {
    // Enforced here, not only by hiding the button: a custom design that
    // renders its own clear must not be able to produce a state the host
    // said it cannot accept.
    if (!allowClear) return;
    onChange(null);
    if (onClose) onClose();
  }

  return {
    tab: tab,
    setTab: setTab,
    presets: presets,
    value: value,
    label: dateValueLabel(value),
    range: range,
    single: single,
    setSingle: setSingle,
    singleParsed: singleParsed,
    suggestions: suggestions,
    applySuggestion: applySuggestion,
    selectPreset: selectPreset,
    setRangeFrom: setRangeFrom,
    setRangeTo: setRangeTo,
    commitSingle: commitSingle,
    clear: clear,
    allowClear: allowClear,
    inheritedLabel: props.inheritedLabel || null
  };
}
