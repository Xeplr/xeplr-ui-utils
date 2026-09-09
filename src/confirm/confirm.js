// Imperative, self-mounting modal dialogs — same shape as ../snackbar/snackbar.js
// (own DOM node, inline styles, no provider/mount point needed, no CSS import).
// Unlike the snackbar these are modal and return a Promise, since a caller needs
// the answer before proceeding (e.g. "enter this workspace?").
//
// Two shapes, ONE dialog surface:
//   raiseConfirm — yes/no. The common case, and unchanged.
//   raiseChoice  — any number of answers, because some questions genuinely have
//                  three. "You have unsaved changes and you are leaving" is the
//                  standing example: save, discard, or come back — and folding
//                  that into a boolean forces the caller to either drop one of
//                  the three or ask twice.
//
// They share _root and _cancelPending deliberately: two dialog surfaces could
// each hold one open at once, and the second would silently cover the first.

var _root = null;
// A second dialog before the first resolves would otherwise stack a second
// overlay into the same _root and add a second document keydown listener —
// cancel whatever's still open before mounting a new one.
var _cancelPending = null;

function ensureRoot() {
  if (_root) return _root;
  _root = document.createElement('div');
  _root.id = 'xeplr-confirm-root';
  document.body.appendChild(_root);
  return _root;
}

/**
 * The shell both shapes are built from.
 *
 * @param {object} spec
 * @param {string}   spec.title
 * @param {string}   spec.message
 * @param {Array}    spec.buttons   - [{ label, value, style: 'primary'|'danger'|'plain', isDefault }]
 *                                    rendered left to right; the LAST one is focused.
 * @param {*}        spec.dismissValue - what Escape, the overlay and a superseding
 *                                    dialog all resolve to.
 * @returns {Promise<*>} the chosen button's `value`
 */
function openDialog(spec) {
  if (_cancelPending) _cancelPending();

  return new Promise(function(resolve) {
    var root = ensureRoot();

    function cleanup(result) {
      document.removeEventListener('keydown', onKeyDown);
      root.innerHTML = '';
      if (_cancelPending === cleanupAsDismiss) _cancelPending = null;
      resolve(result);
    }

    function cleanupAsDismiss() { cleanup(spec.dismissValue); }
    _cancelPending = cleanupAsDismiss;

    function onKeyDown(e) {
      if (e.key === 'Escape') cleanup(spec.dismissValue);
      if (e.key === 'Enter') {
        // Enter takes the DEFAULT, and only if one was named. With three
        // answers there is no obvious one to guess at, and guessing would
        // commit somebody's work — or throw it away — on a stray keypress.
        for (var i = 0; i < spec.buttons.length; i++) {
          if (spec.buttons[i].isDefault) return cleanup(spec.buttons[i].value);
        }
      }
    }

    // var(--xeplr-*, fallback) — picks up @xeplr/ui-account's theme tokens
    // (light/dark, whichever .xeplr-theme-* an ancestor applies) when that
    // stylesheet is loaded, falls back to the original dark palette otherwise.
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:var(--xeplr-bg-overlay,rgba(0,0,0,0.55));z-index:100000;'
      + 'display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function(e) { if (e.target === overlay) cleanup(spec.dismissValue); };

    var box = document.createElement('div');
    box.style.cssText = 'background:var(--xeplr-bg-tertiary,#1a1a1a);color:var(--xeplr-text-primary,#e0e0e0);'
      + 'border:1px solid var(--xeplr-border-primary,#333);border-radius:10px;'
      + 'padding:20px;max-width:420px;width:calc(100% - 40px);font:14px/1.5 system-ui,sans-serif;'
      + 'box-shadow:var(--xeplr-shadow-lg,0 12px 32px rgba(0,0,0,0.4));';

    var titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:16px;font-weight:600;margin-bottom:8px;';
    titleEl.textContent = spec.title;

    var messageEl = document.createElement('div');
    messageEl.style.cssText = 'color:var(--xeplr-text-secondary,#bbb);margin-bottom:18px;';
    messageEl.textContent = spec.message;

    var actions = document.createElement('div');
    // Wraps, because three labels that each say what they DO ("Leave without
    // saving") are longer than "OK" and must not run off a narrow dialog.
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;';

    var lastBtn = null;
    spec.buttons.forEach(function(def) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = def.label;
      if (def.style === 'primary' || def.style === 'danger') {
        var bg = def.style === 'danger' ? 'var(--xeplr-danger,#dc2626)' : 'var(--xeplr-accent,#646cff)';
        btn.style.cssText = 'padding:8px 14px;border:none;border-radius:6px;'
          + 'background:' + bg + ';color:var(--xeplr-accent-text,#fff);font-size:13px;font-weight:600;cursor:pointer;';
      } else {
        btn.style.cssText = 'padding:8px 14px;border:1px solid var(--xeplr-border-primary,#444);border-radius:6px;'
          + 'background:var(--xeplr-bg-secondary,#232323);color:var(--xeplr-text-primary,#e0e0e0);font-size:13px;cursor:pointer;';
      }
      btn.onclick = function() { cleanup(def.value); };
      actions.appendChild(btn);
      lastBtn = btn;
    });

    box.appendChild(titleEl);
    box.appendChild(messageEl);
    box.appendChild(actions);
    overlay.appendChild(box);
    root.appendChild(overlay);

    document.addEventListener('keydown', onKeyDown);
    if (lastBtn) lastBtn.focus();
  });
}

/**
 * @param {string} message
 * @param {object} [options]
 * @param {string} [options.title='Are you sure?']
 * @param {string} [options.confirmLabel='Confirm']
 * @param {string} [options.cancelLabel='Cancel']
 * @param {boolean} [options.danger=false] - style the confirm button as destructive
 * @returns {Promise<boolean>} resolves true (confirmed) or false (cancelled/dismissed)
 */
export function raiseConfirm(message, options) {
  options = options || {};
  return openDialog({
    title: options.title || 'Are you sure?',
    message: message,
    dismissValue: false,
    buttons: [
      { label: options.cancelLabel || 'Cancel', value: false, style: 'plain' },
      { label: options.confirmLabel || 'Confirm', value: true, isDefault: true,
        style: options.danger ? 'danger' : 'primary' }
    ]
  });
}

/**
 * A question with more than two answers.
 *
 * @param {string} message
 * @param {object} options
 * @param {string}  [options.title='Are you sure?']
 * @param {Array}   options.choices - [{ value, label, style?, isDefault? }], left to
 *                  right; the last is focused, and `style` is 'primary' | 'danger' |
 *                  omitted for plain. Put the answer somebody most likely wants last.
 * @param {*}       [options.dismissValue=null] - Escape / clicking away / being
 *                  superseded. Default null, so "they closed the dialog" is
 *                  distinguishable from every deliberate answer.
 * @returns {Promise<*>} the chosen `value`
 */
export function raiseChoice(message, options) {
  options = options || {};
  var choices = options.choices || [];
  return openDialog({
    title: options.title || 'Are you sure?',
    message: message,
    dismissValue: options.dismissValue === undefined ? null : options.dismissValue,
    buttons: choices.map(function(c) {
      return { label: c.label, value: c.value, style: c.style || 'plain', isDefault: c.isDefault };
    })
  });
}
