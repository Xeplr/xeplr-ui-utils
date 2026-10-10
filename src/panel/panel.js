// Panel — model. Which expanders of a settings panel are open. A panel opens
// one at a time by default (opening one closes the rest), or any number with
// `multiple`. No React here.

/** The open keys after `key` is clicked. */
export function toggleOpen(open, key, multiple) {
  var isOpen = open.indexOf(key) !== -1;
  if (multiple) return isOpen ? open.filter(function(k) { return k !== key; }) : open.concat([key]);
  return isOpen ? [] : [key];
}

/** The keys open at first: `initial` (a key or a list), else the first item, kept to known keys. */
export function initialOpen(items, initial, multiple) {
  var keys = items.map(function(i) { return i.key; });
  var wanted = initial === undefined ? keys.slice(0, 1) : [].concat(initial || []);
  wanted = wanted.filter(function(k) { return keys.indexOf(k) !== -1; });
  return multiple ? wanted : wanted.slice(0, 1);
}

// ── Settings tree ─────────────────────────────────────────────────────────
// Which branch is open at each level: { [parentKey]: openChildKey }, the root's
// parent being ''. One open per level, so opening a sibling closes the other
// and a deep tree never becomes one long scroll.

/** The open map after `key` (a child of `parentKey`) is clicked. */
export function toggleBranch(open, parentKey, key) {
  var next = Object.assign({}, open);
  if (next[parentKey] === key) delete next[parentKey];
  else next[parentKey] = key;
  return next;
}

/**
 * The nodes with `open` and `depth` filled in, all the way down. A node is
 * { key, title, icon?, count?, content?, children? }.
 */
export function decorateTree(nodes, open, parentKey, depth) {
  parentKey = parentKey || '';
  depth = depth || 0;
  return (nodes || []).map(function(n) {
    return Object.assign({}, n, {
      parentKey: parentKey,
      depth: depth,
      open: open[parentKey] === n.key,
      children: n.children && n.children.length ? decorateTree(n.children, open, n.key, depth + 1) : null
    });
  });
}
