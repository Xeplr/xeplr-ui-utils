import { useLayoutEffect, useRef, useState } from 'react';
import { missingFrom } from './designCheck.js';

/**
 * DesignCheck — controller. Checks the design after EVERY render (rules with
 * `when` depend on what is open), and once something is missing, keeps it
 * missing: the page shows the error, not a design that half works.
 *
 *   var check = useDesignCheck(LOGIN_RULES, controller)
 *   if (check.missing.length) return <MyBroken missing={check.missing} />
 *   return <div ref={check.ref}><Design {...controller} /></div>
 *
 * @param {Array} rules  - see designCheck.js
 * @param {any} state    - what `when` is asked about (usually the controller)
 * @returns {{ ref, missing: string[] }}
 */
export function useDesignCheck(rules, state) {
  var ref = useRef(null);
  var missingState = useState([]);
  var missing = missingState[0];
  var setMissing = missingState[1];
  useLayoutEffect(function() {
    if (missing.length) return;
    var m = missingFrom(ref.current, rules, state);
    if (m.length) {
      console.error('[xeplr-ui-utils] design is missing required elements:\n' + m.map(function(x) { return '  - ' + x; }).join('\n'));
      setMissing(m);
    }
  });
  return { ref: ref, missing: missing };
}
