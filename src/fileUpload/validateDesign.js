import { useEffect, useRef } from 'react';

/**
 * Validates that required elements exist in the rendered design.
 * Throws a visible error if any required element is missing.
 *
 * @param {string} componentName - Name of the page (for error messages)
 * @param {Array<{id?: string, role?: string, selector?: string, label: string}>} requiredElements
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
      } else if (rule.selector) {
        found = !!containerRef.current.querySelector(rule.selector);
      }

      if (!found) {
        missing.push(rule.label + (rule.id ? ' (id="' + rule.id + '")' : '') + (rule.selector ? ' (' + rule.selector + ')' : ''));
      }
    }

    if (missing.length > 0) {
      throw new Error(
        '[xeplr-ui-utils] ' + componentName + ' design is missing required elements:\n' +
        missing.map(function(m) { return '  - ' + m; }).join('\n')
      );
    }
  }, []);

  return containerRef;
}

export var FILE_UPLOAD_RULES = [
  { selector: 'input[type="file"]', label: 'File input' },
  { selector: '.xeplr-upload-dropzone, [role="dropzone"]', label: 'Drop zone area' },
  { selector: 'button', label: 'Upload/action button' }
];
