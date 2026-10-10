import { DEFAULT_SWATCHES, parseColor, formatColor, sameHue } from './colorPicker.js';

/**
 * ColorPicker — controller. The value is one CSS colour (see colorPicker.js);
 * every change goes straight to onChange. No JSX here.
 *
 * @param {object} props
 * @param {string|null} props.value       - '#RRGGBB' / '#RRGGBBAA', or null for none
 * @param {Function}    props.onChange    - (value|null) => void
 * @param {string[]}    [props.swatches]  - default DEFAULT_SWATCHES
 * @param {boolean}     [props.allowNone] - default true: offer "no colour"
 * @param {boolean}     [props.allowOpacity] - default true
 * @param {string}      [props.previewText] - default 'Aa 123'
 * @param {string}      [props.label]
 */
export function useColorPickerController(props) {
  var onChange = props.onChange || function() {};
  var parsed = parseColor(props.value);
  var swatches = props.swatches || DEFAULT_SWATCHES;
  var opacity = parsed ? parsed.opacity : 100;

  function pick(hex) { onChange(formatColor(hex, parsed ? opacity : 100)); }
  function setOpacity(value) { if (parsed) onChange(formatColor(parsed.hex, value)); }
  function clear() { onChange(null); }

  return {
    label: props.label || null,
    value: parsed ? formatColor(parsed.hex, opacity) : null,
    hex: parsed ? parsed.hex : null,
    opacity: opacity,
    swatches: swatches.map(function(s) { return { color: s, selected: sameHue(s, props.value) }; }),
    // A colour not among the swatches still shows as picked, in the custom one.
    custom: Boolean(parsed && !swatches.some(function(s) { return sameHue(s, props.value); })),
    allowNone: props.allowNone !== false,
    allowOpacity: props.allowOpacity !== false,
    previewText: props.previewText || 'Aa 123',
    pick: pick,
    setOpacity: setOpacity,
    clear: clear
  };
}
