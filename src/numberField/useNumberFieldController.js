import { useState, useEffect, useMemo } from 'react';
import {
  sanitizeNumberInput,
  toNumeric,
  formatDisplay,
  validateRange,
  resolveAffixState,
  NUMBER_TYPES
} from './numberField.js';

/**
 * @param {object} props
 * @param {'float'|'currency'|'units'} [props.type='float']
 * @param {number|null} [props.value]            — controlled numeric value
 * @param {number|null} [props.defaultValue]     — uncontrolled initial value
 * @param {(value, meta) => void} [props.onChange] — called with (numericValue, { affix })
 * @param {Array} [props.currencies]   — for currency type: [{ code, symbol }]
 * @param {string} [props.defaultCurrency]
 * @param {'before'|'after'} [props.currencyPosition='before']
 * @param {Array} [props.units]        — for units type: [{ value, label }]
 * @param {string} [props.defaultUnit]
 * @param {'before'|'after'} [props.unitPosition='after']
 * @param {number} [props.min]
 * @param {number} [props.max]
 * @param {number} [props.decimals]    — display decimals on blur
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 */
export function useNumberFieldController(props) {
  props = props || {};
  var type = props.type || 'float';
  if (NUMBER_TYPES.indexOf(type) === -1) {
    throw new Error('[xeplr-ui-utils:NumberField] Unknown type: ' + type + '. Expected one of ' + NUMBER_TYPES.join(', '));
  }

  var affixInit = useMemo(function() {
    return resolveAffixState(type, props);
  }, [
    type,
    props.currencies, props.defaultCurrency, props.currencyPosition,
    props.units, props.defaultUnit, props.unitPosition
  ]);

  var isControlled = props.value !== undefined;
  var initial = isControlled ? props.value : (props.defaultValue !== undefined ? props.defaultValue : null);

  var [raw, setRaw] = useState(initial === null || initial === undefined ? '' : String(initial));
  var [affix, setAffix] = useState(affixInit ? affixInit.selected : null);
  var [error, setError] = useState('');

  useEffect(function() {
    if (isControlled) {
      var next = props.value === null || props.value === undefined ? '' : String(props.value);
      setRaw(next);
    }
  }, [props.value, isControlled]);

  useEffect(function() {
    if (affixInit) setAffix(affixInit.selected);
  }, [affixInit]);

  function emit(nextRaw, nextAffix) {
    var numeric = toNumeric(nextRaw);
    var rangeCheck = validateRange(numeric, props.min, props.max);
    setError(rangeCheck.valid ? '' : rangeCheck.error);
    if (props.onChange) {
      props.onChange(numeric, { affix: nextAffix });
    }
  }

  function handleNumberChange(e) {
    var sanitized = sanitizeNumberInput(e.target.value);
    if (!isControlled) setRaw(sanitized);
    emit(sanitized, affix);
  }

  function handleAffixChange(e) {
    var nextValue = e.target.value;
    var next = (affixInit.list).find(function(item) {
      return item[affixInit.valueKey] === nextValue;
    });
    if (!next) return;
    setAffix(next);
    emit(raw, next);
  }

  function handleBlur() {
    var numeric = toNumeric(raw);
    if (numeric === null) return;
    if (typeof props.decimals === 'number') {
      var fixed = numeric.toFixed(props.decimals);
      if (!isControlled) setRaw(fixed);
    }
  }

  return {
    type,
    raw,
    numeric: toNumeric(raw),
    error,
    placeholder: props.placeholder,
    disabled: !!props.disabled,
    decimals: props.decimals,
    formatDisplay: formatDisplay,
    affix: affixInit ? {
      list: affixInit.list,
      selected: affix,
      position: affixInit.position,
      labelKey: affixInit.labelKey,
      valueKey: affixInit.valueKey
    } : null,
    handleNumberChange,
    handleAffixChange,
    handleBlur
  };
}
