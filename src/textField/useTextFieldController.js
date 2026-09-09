import { useState, useMemo, useCallback } from 'react';
import { toValue, normalise, validate, remaining, TEXT_TYPES } from './textField.js';

/**
 * @param {object} props
 * @param {'text'|'multiline'|'search'} [props.type='text']
 * @param {string} [props.value]          — controlled
 * @param {string} [props.defaultValue]   — uncontrolled initial
 * @param {(value) => void} [props.onChange]
 * @param {(value) => void} [props.onCommit]  — on blur/Enter, after normalising
 * @param {boolean} [props.required]
 * @param {number} [props.minLength]
 * @param {number} [props.maxLength]
 * @param {RegExp|string} [props.pattern]
 * @param {boolean} [props.trim]          — normalise away surrounding space
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {number} [props.rows]           — multiline only
 */
export function useTextFieldController(props) {
  props = props || {};
  var type = props.type || 'text';
  if (TEXT_TYPES.indexOf(type) === -1) {
    throw new Error('[xeplr-ui-utils:TextField] Unknown type: ' + type + '. Expected one of ' + TEXT_TYPES.join(', '));
  }

  var controlled = props.value !== undefined;
  var [inner, setInner] = useState(toValue(props.defaultValue));
  var raw = controlled ? toValue(props.value) : inner;

  // Errors appear on COMMIT, not on every keystroke. A required field that
  // says "This is required" while you are still typing the first letter is
  // shouting at somebody for not having finished.
  var [touched, setTouched] = useState(false);

  var options = useMemo(function() {
    return {
      required: props.required,
      requiredMessage: props.requiredMessage,
      minLength: props.minLength,
      maxLength: props.maxLength,
      pattern: props.pattern,
      patternMessage: props.patternMessage,
      trim: props.trim
    };
  }, [props.required, props.requiredMessage, props.minLength, props.maxLength,
      props.pattern, props.patternMessage, props.trim]);

  var handleChange = useCallback(function(e) {
    var next = e && e.target ? e.target.value : e;
    // Capped as you type, because a maxLength you can exceed and are told off
    // for afterwards is a maxLength that does nothing.
    if (props.maxLength != null) next = String(next).slice(0, props.maxLength);
    if (!controlled) setInner(next);
    if (props.onChange) props.onChange(next);
  }, [controlled, props.maxLength, props.onChange]);

  var commit = useCallback(function(value) {
    var next = normalise(value, options);
    setTouched(true);
    if (!controlled && next !== value) setInner(next);
    if (props.onCommit) props.onCommit(next);
    else if (next !== value && props.onChange) props.onChange(next);
  }, [controlled, options, props.onChange, props.onCommit]);

  var handleBlur = useCallback(function(e) {
    commit(e && e.target ? e.target.value : raw);
  }, [commit, raw]);

  var handleKeyDown = useCallback(function(e) {
    // Enter commits a single-line field; in a multiline one it is a newline.
    if (e.key === 'Enter' && type !== 'multiline') commit(e.target.value);
    if (e.key === 'Escape' && props.onCancel) props.onCancel();
  }, [commit, type, props.onCancel]);

  var handleClear = useCallback(function() {
    if (!controlled) setInner('');
    if (props.onChange) props.onChange('');
    if (props.onCommit) props.onCommit('');
  }, [controlled, props.onChange, props.onCommit]);

  var error = touched ? validate(raw, options) : null;

  return {
    type: type,
    raw: raw,
    error: error,
    remaining: remaining(raw, props.maxLength),
    placeholder: props.placeholder,
    disabled: props.disabled,
    required: props.required,
    maxLength: props.maxLength,
    rows: props.rows,
    label: props.label,
    help: props.help,
    handleChange: handleChange,
    handleBlur: handleBlur,
    handleKeyDown: handleKeyDown,
    handleClear: handleClear
  };
}
