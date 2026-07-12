import './numberField.css';

export default function NumberFieldSample({
  type, raw, error, placeholder, disabled, affix,
  handleNumberChange, handleAffixChange, handleBlur
}) {
  function renderAffix() {
    if (!affix) return null;
    if (affix.list.length === 1) {
      return <span className="xeplr-numberfield-affix-static">{affix.selected[affix.labelKey]}</span>;
    }
    return (
      <select
        className="xeplr-numberfield-affix-select"
        value={affix.selected[affix.valueKey]}
        onChange={handleAffixChange}
        disabled={disabled}
      >
        {affix.list.map(function(item) {
          return (
            <option key={item[affix.valueKey]} value={item[affix.valueKey]}>
              {item[affix.labelKey]}
            </option>
          );
        })}
      </select>
    );
  }

  var affixBefore = affix && affix.position === 'before';
  var affixAfter = affix && affix.position === 'after';

  return (
    <div className={'xeplr-numberfield xeplr-numberfield-' + type + (error ? ' xeplr-numberfield-error' : '')}>
      <div className="xeplr-numberfield-row">
        {affixBefore && renderAffix()}
        <input
          type="text"
          inputMode="decimal"
          className="xeplr-numberfield-input"
          value={raw}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleNumberChange}
          onBlur={handleBlur}
        />
        {affixAfter && renderAffix()}
      </div>
      {error && <div className="xeplr-numberfield-error-text">{error}</div>}
    </div>
  );
}
