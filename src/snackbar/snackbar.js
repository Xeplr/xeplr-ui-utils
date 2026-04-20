var _container = null;
var _queue = [];
var _timer = null;

var DESIGNS = {
  success: { bg: '#059669', color: '#fff' },
  error: { bg: '#dc2626', color: '#fff' },
  default: { bg: '#2563eb', color: '#fff' }
};

var DEFAULT_DURATION = 3000;

function _ensureContainer() {
  if (_container) return _container;

  _container = document.createElement('div');
  _container.id = 'xeplr-snackbar-container';
  _container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;';
  document.body.appendChild(_container);
  return _container;
}

function _createEl(message, design, duration) {
  var colors = DESIGNS[design] || DESIGNS.default;

  var el = document.createElement('div');
  el.style.cssText = 'padding:12px 20px;border-radius:6px;font:14px/1.4 system-ui,sans-serif;max-width:380px;word-break:break-word;pointer-events:auto;opacity:0;transform:translateY(8px);transition:opacity 0.2s,transform 0.2s;cursor:pointer;'
    + 'background:' + colors.bg + ';color:' + colors.color + ';';
  el.textContent = message;

  el.onclick = function() { _dismiss(el); };

  // Animate in
  requestAnimationFrame(function() {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  // Auto dismiss
  el._timeout = setTimeout(function() { _dismiss(el); }, duration);

  return el;
}

function _dismiss(el) {
  if (el._dismissed) return;
  el._dismissed = true;
  clearTimeout(el._timeout);
  el.style.opacity = '0';
  el.style.transform = 'translateY(8px)';
  setTimeout(function() {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 200);
}

/**
 * Show a snackbar notification.
 *
 * @param {string} message - Text to display
 * @param {object} [options]
 * @param {string} [options.design='default'] - 'success' | 'error' | 'default'
 * @param {number} [options.duration=3000] - Auto-dismiss in ms
 */
export function raiseSnackbar(message, options) {
  options = options || {};
  var design = options.design || 'default';
  var duration = options.duration || DEFAULT_DURATION;

  var container = _ensureContainer();
  var el = _createEl(message, design, duration);
  container.appendChild(el);
}
