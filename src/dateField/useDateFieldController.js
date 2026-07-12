import { useState, useEffect, useMemo } from 'react';
import {
  DATE_TYPES,
  calculateAge,
  inputTypeFor,
  toInputValue,
  validateBounds
} from './dateField.js';

/**
 * @param {object} props
 * @param {'date'|'datetime'|'age'} [props.type='date']
 * @param {Date|string|null} [props.value]        — controlled value
 * @param {Date|string|null} [props.defaultValue] — uncontrolled initial value
 * @param {(value, meta) => void} [props.onChange] — meta.age included for age type
 * @param {Date|string} [props.min]
 * @param {Date|string} [props.max]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 */
export function useDateFieldController(props) {
  props = props || {};
  var type = props.type || 'date';
  if (DATE_TYPES.indexOf(type) === -1) {
    throw new Error('[xeplr-ui-utils:DateField] Unknown type: ' + type + '. Expected one of ' + DATE_TYPES.join(', '));
  }

  var isControlled = props.value !== undefined;
  var initial = isControlled ? props.value : (props.defaultValue !== undefined ? props.defaultValue : null);

  var [raw, setRaw] = useState(toInputValue(initial, type === 'age' ? 'date' : type));
  var [error, setError] = useState('');

  useEffect(function() {
    if (isControlled) {
      setRaw(toInputValue(props.value, type === 'age' ? 'date' : type));
    }
  }, [props.value, isControlled, type]);

  var inputType = useMemo(function() {
    return inputTypeFor(type === 'age' ? 'date' : type);
  }, [type]);

  var age = useMemo(function() {
    if (type !== 'age') return null;
    return calculateAge(raw);
  }, [type, raw]);

  function emit(nextRaw) {
    var bounds = validateBounds(nextRaw, props.min, props.max);
    setError(bounds.valid ? '' : bounds.error);
    if (props.onChange) {
      var meta = {};
      if (type === 'age') meta.age = calculateAge(nextRaw);
      props.onChange(nextRaw || null, meta);
    }
  }

  function handleChange(e) {
    var v = e.target.value;
    if (!isControlled) setRaw(v);
    emit(v);
  }

  return {
    type,
    inputType,
    raw,
    age,
    error,
    placeholder: props.placeholder,
    disabled: !!props.disabled,
    min: props.min ? toInputValue(props.min, type === 'age' ? 'date' : type) : undefined,
    max: props.max ? toInputValue(props.max, type === 'age' ? 'date' : type) : undefined,
    handleChange
  };
}
