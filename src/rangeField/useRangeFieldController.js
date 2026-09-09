import { useDateFieldController } from '../dateField/useDateFieldController.js';
import { normalizeRange } from './rangeField.js';

/**
 * Two DateField controllers, cross-bounded — From can't be set past To, To
 * can't be set before From, each side gets that for free rather than the
 * caller re-deriving it. Composition over reimplementation: this is not a
 * second date-input implementation, it's dateField's, called twice.
 *
 * @param {object} props
 * @param {'date'|'datetime'} [props.type='date']
 * @param {{from, to}} [props.value] — controlled; {from:'', to:''} if absent
 * @param {(value: {from, to}) => void} [props.onChange]
 * @param {Date|string} [props.min] — floor for From (and, absent an explicit To, for To too)
 * @param {Date|string} [props.max] — ceiling for To (and, absent an explicit From, for From too)
 * @param {boolean} [props.disabled]
 * @param {string} [props.fromLabel='From']
 * @param {string} [props.toLabel='To']
 * @param {string} [props.toPlaceholder] — e.g. "Now", for an open-ended end
 */
export function useRangeFieldController(props) {
  props = props || {};
  var type = props.type || 'date';
  var range = normalizeRange(props.value);

  var from = useDateFieldController({
    type: type,
    value: range.from || null,
    onChange: function(v) { if (props.onChange) props.onChange({ from: v || '', to: range.to }); },
    min: props.min,
    max: range.to || props.max,
    disabled: props.disabled,
    placeholder: props.fromPlaceholder
  });

  var to = useDateFieldController({
    type: type,
    value: range.to || null,
    onChange: function(v) { if (props.onChange) props.onChange({ from: range.from, to: v || '' }); },
    min: range.from || props.min,
    max: props.max,
    disabled: props.disabled,
    placeholder: props.toPlaceholder
  });

  return {
    fromLabel: props.fromLabel || 'From',
    toLabel: props.toLabel || 'To',
    from: from,
    to: to
  };
}
