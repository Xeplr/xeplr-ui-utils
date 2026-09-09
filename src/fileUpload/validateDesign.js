import { useEffect, useRef } from 'react';

/**
 * Validates that required elements exist in the rendered design, and reports
 * loudly when they don't — console.error plus a data-xeplr-design-invalid
 * marker on the container.
 *
 * A rule matches by id, role or selector. `anyOf` takes a list of selectors
 * and passes when ANY one is present — which is what a design with tabs or
 * steps needs, since only the current one is mounted and demanding all of
 * them at once can never pass.
 *
 * @param {string} componentName - Name of the page (for error messages)
 * @param {Array<{id?: string, role?: string, selector?: string, anyOf?: string[], label: string}>} requiredElements
 */
export function useDesignValidator(componentName, requiredElements) {
  var containerRef = useRef(null);

  useEffect(function() {
    if (!containerRef.current) return;

    var missing = [];
    for (var i = 0; i < requiredElements.length; i++) {
      var rule = requiredElements[i];
      var found = false;

      if (rule.id) {
        found = !!containerRef.current.querySelector('#' + rule.id);
      } else if (rule.role) {
        found = !!containerRef.current.querySelector('[role="' + rule.role + '"]');
      } else if (rule.anyOf) {
        for (var j = 0; j < rule.anyOf.length && !found; j++) {
          found = !!containerRef.current.querySelector(rule.anyOf[j]);
        }
      } else if (rule.selector) {
        found = !!containerRef.current.querySelector(rule.selector);
      }

      if (!found) {
        var where = rule.id ? ' (id="' + rule.id + '")'
          : rule.anyOf ? ' (one of: ' + rule.anyOf.join(', ') + ')'
          : rule.selector ? ' (' + rule.selector + ')' : '';
        missing.push(rule.label + where);
      }
    }

    if (missing.length > 0) {
      // Reported, not thrown. Throwing from an effect gives React nothing to
      // catch, so a design rule — a development-time check — took the whole
      // application down with it. The container is marked so the failure is
      // visible on the page as well as in the console, which is what "fail
      // loudly" was ever meant to buy.
      var message = '[xeplr-ui-utils] ' + componentName + ' design is missing required elements:\n' +
        missing.map(function(m) { return '  - ' + m; }).join('\n');
      console.error(message);
      containerRef.current.setAttribute('data-xeplr-design-invalid', componentName);
      containerRef.current.setAttribute('title', message);
    }
  }, []);

  return containerRef;
}

export var FILE_UPLOAD_RULES = [
  { selector: 'input[type="file"]', label: 'File input' },
  { selector: '.xeplr-upload-dropzone, [role="dropzone"]', label: 'Drop zone area' },
  { selector: 'button', label: 'Upload/action button' }
];
