// Imperative, self-mounting confirm dialog — same shape as ../snackbar/snackbar.js
// (own DOM node, inline styles, no provider/mount point needed, no CSS import).
// Unlike the snackbar it's modal and returns a Promise, since a caller needs
// the answer before proceeding (e.g. "enter this workspace?").

var _root = null;
// A second raiseConfirm() before the first resolves would otherwise stack a
// second overlay into the same _root and add a second document keydown
// listener — cancel whatever's still open before mounting a new one.
var _cancelPending = null;

function ensureRoot() {
  if (_root) return _root;
  _root = document.createElement('div');
  _root.id = 'xeplr-confirm-root';
  document.body.appendChild(_root);
  return _root;
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
  var title = options.title || 'Are you sure?';
  var confirmLabel = options.confirmLabel || 'Confirm';
  var cancelLabel = options.cancelLabel || 'Cancel';

  if (_cancelPending) _cancelPending();

  return new Promise(function(resolve) {
    var root = ensureRoot();

    function cleanup(result) {
      document.removeEventListener('keydown', onKeyDown);
      root.innerHTML = '';
      if (_cancelPending === cleanupAsCancel) _cancelPending = null;
      resolve(result);
    }

    function cleanupAsCancel() { cleanup(false); }
    _cancelPending = cleanupAsCancel;

    function onKeyDown(e) {
      if (e.key === 'Escape') cleanup(false);
      if (e.key === 'Enter') cleanup(true);
    }

    // var(--xeplr-*, fallback) — picks up @xeplr/ui-account's theme tokens
    // (light/dark, whichever .xeplr-theme-* an ancestor applies) when that
    // stylesheet is loaded, falls back to the original dark palette otherwise.
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:var(--xeplr-bg-overlay,rgba(0,0,0,0.55));z-index:100000;'
      + 'display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function(e) { if (e.target === overlay) cleanup(false); };

    var box = document.createElement('div');
    box.style.cssText = 'background:var(--xeplr-bg-tertiary,#1a1a1a);color:var(--xeplr-text-primary,#e0e0e0);'
      + 'border:1px solid var(--xeplr-border-primary,#333);border-radius:10px;'
      + 'padding:20px;max-width:380px;width:calc(100% - 40px);font:14px/1.5 system-ui,sans-serif;'
      + 'box-shadow:var(--xeplr-shadow-lg,0 12px 32px rgba(0,0,0,0.4));';

    var titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:16px;font-weight:600;margin-bottom:8px;';
    titleEl.textContent = title;

    var messageEl = document.createElement('div');
    messageEl.style.cssText = 'color:var(--xeplr-text-secondary,#bbb);margin-bottom:18px;';
    messageEl.textContent = message;

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.style.cssText = 'padding:8px 14px;border:1px solid var(--xeplr-border-primary,#444);border-radius:6px;'
      + 'background:var(--xeplr-bg-secondary,#232323);color:var(--xeplr-text-primary,#e0e0e0);font-size:13px;cursor:pointer;';
    cancelBtn.onclick = function() { cleanup(false); };

    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = confirmLabel;
    var confirmBg = options.danger ? 'var(--xeplr-danger,#dc2626)' : 'var(--xeplr-accent,#646cff)';
    confirmBtn.style.cssText = 'padding:8px 14px;border:none;border-radius:6px;'
      + 'background:' + confirmBg + ';color:var(--xeplr-accent-text,#fff);font-size:13px;font-weight:600;cursor:pointer;';
    confirmBtn.onclick = function() { cleanup(true); };

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(titleEl);
    box.appendChild(messageEl);
    box.appendChild(actions);
    overlay.appendChild(box);
    root.appendChild(overlay);

    document.addEventListener('keydown', onKeyDown);
    confirmBtn.focus();
  });
}
