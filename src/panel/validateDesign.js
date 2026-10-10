// An expanders design must give each item a header that opens it.
export var EXPANDERS_RULES = [
  { selector: '.xeplr-expander-head, [aria-expanded]', label: 'A header per item that opens it' }
];

// A settings tree design must give each node a header that opens it.
export var SETTINGS_TREE_RULES = [
  { selector: '.xeplr-tree-head, [aria-expanded]', label: 'A header per node that opens it' }
];
