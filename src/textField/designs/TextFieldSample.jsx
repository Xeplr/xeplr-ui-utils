import './textField.css';

// The default LOOK. Presentation only — every value it renders comes in as a
// prop, so an app that wants a different one supplies its own design and this
// is never loaded.
//
// Nothing here is hard-coded to a colour or an edge: the CSS reads
// --xeplr-input-* custom properties, so "bottom rule only" is a theme setting
// rather than a fork of this file.
export default function TextFieldSample({
  type, raw, error, remaining, placeholder, disabled, required, maxLength, rows,
  label, help, handleChange, handleBlur, handleKeyDown, handleClear
}) {
  var multiline = type === 'multiline';
  var search = type === 'search';

  return (
    <div className={'xeplr-textfield' + (error ? ' xeplr-textfield-invalid' : '')}>
      {label && (
        <label className="xeplr-textfield-label">
          {label}{required && <span className="xeplr-textfield-required" aria-hidden="true"> *</span>}
        </label>
      )}

      <div className="xeplr-textfield-control">
        {multiline ? (
          <textarea
            className="xeplr-textfield-input"
            value={raw}
            rows={rows || 4}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : undefined}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        ) : (
          <input
            className="xeplr-textfield-input"
            type={search ? 'search' : 'text'}
            value={raw}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : undefined}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        )}

        {/* Only when there is something to clear — a permanently visible ✕ on
            an empty box is a control that does nothing most of the time. */}
        {search && raw && !disabled && (
          <button type="button" className="xeplr-textfield-clear" onClick={handleClear} title="Clear">✕</button>
        )}
      </div>

      {/* The error REPLACES the help text rather than stacking under it: two
          lines of guidance where one contradicts the other is worse than one. */}
      {error ? (
        <p className="xeplr-textfield-error">{error}</p>
      ) : help ? (
        <p className="xeplr-textfield-help">{help}</p>
      ) : null}

      {/* Shown near the limit, not always. A counter reading 486 of 500 from
          the moment the field appears is noise. */}
      {remaining != null && maxLength != null && remaining <= Math.max(10, maxLength * 0.1) && (
        <p className="xeplr-textfield-count">{remaining} left</p>
      )}
    </div>
  );
}
