import './dateField.css';

export default function DateFieldSample({
  type, inputType, raw, age, error, placeholder, disabled, min, max,
  handleChange
}) {
  return (
    <div className={'xeplr-datefield xeplr-datefield-' + type + (error ? ' xeplr-datefield-error' : '')}>
      <div className="xeplr-datefield-row">
        <input
          type={inputType}
          className="xeplr-datefield-input"
          value={raw}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          onChange={handleChange}
        />
        {type === 'age' && (
          <div className="xeplr-datefield-age">
            <span className="xeplr-datefield-age-label">Age</span>
            <span className="xeplr-datefield-age-value">{age === null ? '—' : age + ' yrs'}</span>
          </div>
        )}
      </div>
      {error && <div className="xeplr-datefield-error-text">{error}</div>}
    </div>
  );
}
