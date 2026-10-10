import { useState } from 'react';
import { toggleOpen, initialOpen } from './panel.js';

/**
 * Expanders — controller. A list of titled parts of a panel, opened one at a
 * time unless `multiple`. No JSX here.
 *
 * @param {object} props
 * @param {Array<{key, title, summary?, icon?, content}>} props.items
 * @param {string|string[]|null} [props.initial] - open at first (default: the first item)
 * @param {boolean} [props.multiple] - let several be open together
 */
export function useExpandersController(props) {
  var items = props.items || [];
  var multiple = Boolean(props.multiple);
  var state = useState(function() { return initialOpen(items, props.initial, multiple); });
  var open = state[0];

  return {
    items: items.map(function(i) { return Object.assign({}, i, { open: open.indexOf(i.key) !== -1 }); }),
    toggle: function(key) { state[1](function(o) { return toggleOpen(o, key, multiple); }); }
  };
}
