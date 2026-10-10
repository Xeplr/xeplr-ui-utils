import { useState } from 'react';
import { toggleBranch, decorateTree } from './panel.js';

/**
 * SettingsTree — controller. Nested groups of settings, one open per level.
 * No JSX here.
 *
 * @param {object} props
 * @param {Array<{key, title, icon?, count?, content?, children?}>} props.nodes
 * @param {object} [props.initial] - { [parentKey]: openChildKey }, root parent ''
 */
export function useSettingsTreeController(props) {
  var state = useState(props.initial || {});
  return {
    nodes: decorateTree(props.nodes, state[0]),
    toggle: function(parentKey, key) { state[1](function(o) { return toggleBranch(o, parentKey, key); }); }
  };
}
