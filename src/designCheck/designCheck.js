/**
 * DesignCheck — model. Which required elements a rendered design is missing.
 * Pure: it only calls querySelector on the root it is given.
 *
 * The BLOCKING check, for a page whose design must not load without its
 * controls: the page renders an error naming what is missing INSTEAD of the
 * design (useDesignCheck). useDesignValidator (fileUpload/validateDesign.js)
 * is the other kind — it reports and lets the design load — and stays as it is.
 *
 * Rules take the same shapes as useDesignValidator's, plus `when`:
 *   { id: 'x-email', label: 'Email input' }
 *   { role: 'listbox', label: '…' }
 *   { selector: 'button[type="submit"]', label: '…' }
 *   { anyOf: ['#a', '#b'], label: '…' }
 *   { selector: '#x-code', label: '…', when: (c) => c.needsCode }   // only while that holds
 */

/** The selector a rule looks for, or a list of them for anyOf. */
export function ruleSelectors(rule) {
  if (rule.id) return ['#' + rule.id];
  if (rule.role) return ['[role="' + rule.role + '"]'];
  if (rule.anyOf) return rule.anyOf.slice();
  if (rule.selector) return [rule.selector];
  return [];
}

/** Whether a rule is checked now: always, or while its `when(state)` holds. */
export function ruleApplies(rule, state) {
  return !rule.when || Boolean(rule.when(state));
}

/** What a missing rule is called: its label and where it was looked for. */
export function ruleLabel(rule) {
  var where = rule.id ? ' (id="' + rule.id + '")'
    : rule.anyOf ? ' (one of: ' + rule.anyOf.join(', ') + ')'
    : rule.selector ? ' (' + rule.selector + ')'
    : rule.role ? ' (role="' + rule.role + '")' : '';
  return rule.label + where;
}

/** The labels of the rules `root` breaks, given the page's `state` for `when`. [] when none. */
export function missingFrom(root, rules, state) {
  if (!root) return [];
  return (rules || []).filter(function(rule) {
    if (!ruleApplies(rule, state)) return false;
    return !ruleSelectors(rule).some(function(s) { return root.querySelector(s); });
  }).map(ruleLabel);
}
