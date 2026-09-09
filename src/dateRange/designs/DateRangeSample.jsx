import './dateRange.css';

var TABS = [
  ['quick', 'Quick date'],
  ['range', 'Range'],
  ['single', 'Single']
];

/**
 * DateRange — design. Presentation only: everything arrives as props from
 * useDateRangeController, so an app can swap this out without touching the
 * behaviour.
 *
 * Three ways in, because they are genuinely different questions:
 *   Quick   — "the current month", which stays current as time passes
 *   Range   — two explicit dates
 *   Single  — one date, month or year, typed
 */
export default function DateRangeSample(props) {
  return (
    <div className="xeplr-daterange">
      <div className="xeplr-daterange-tabs">
        {TABS.map(function(t) {
          return (
            <button
              key={t[0]}
              type="button"
              data-xeplr-daterange-tab={t[0]}
              className={props.tab === t[0] ? 'active' : ''}
              onClick={function() { props.setTab(t[0]); }}
            >
              {t[1]}
            </button>
          );
        })}
      </div>

      {props.tab === 'quick' && (
        <div className="xeplr-daterange-list">
          {props.presets.map(function(p) {
            var on = props.value && props.value.kind === 'quick' && props.value.preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                data-xeplr-daterange-preset={p.key}
                className={'xeplr-daterange-item' + (on ? ' on' : '')}
                onClick={function() { props.selectPreset(p.key); }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {props.tab === 'range' && (
        <div className="xeplr-daterange-body">
          <label className="xeplr-daterange-field">
            <span>From</span>
            <input type="date" value={props.range.from || ''} onChange={function(e) { props.setRangeFrom(e.target.value); }} />
          </label>
          <label className="xeplr-daterange-field">
            <span>To</span>
            <input type="date" value={props.range.to || ''} onChange={function(e) { props.setRangeTo(e.target.value); }} />
          </label>
          {/* One-sided is legitimate — "everything since April" is a real
              answer — so it is stated rather than blocked. */}
          <div className="xeplr-daterange-note">Leave either side empty for an open-ended range.</div>
        </div>
      )}

      {props.tab === 'single' && (
        <div className="xeplr-daterange-body">
          <input
            className="xeplr-daterange-input"
            value={props.single}
            placeholder="1/1/2022, May 2022, or 2022"
            onChange={function(e) { props.setSingle(e.target.value); }}
            onBlur={function() { props.commitSingle(false); }}
            onKeyDown={function(e) {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              props.commitSingle(true);
            }}
          />
          {/* WHAT YOU PROBABLY MEAN, one click away. "j" is three months and
              every month is several years — the list is shorter than typing
              the rest, and it is ordered so the year already on screen comes
              first. Months and years only; a day is quicker to finish typing
              than to find among thirty. */}
          {props.suggestions && props.suggestions.length > 0 && (
            <ul className="xeplr-daterange-suggest">
              {props.suggestions.map(function(s) {
                return (
                  <li key={s.value}>
                    <button
                      type="button"
                      // MOUSEDOWN, not click: the input's onBlur commits what
                      // is typed and would close this list before a click ever
                      // landed on it.
                      onMouseDown={function(e) { e.preventDefault(); props.applySuggestion(s.value); }}
                    >
                      <span>{s.label}</span>
                      {s.note && <span className="xeplr-daterange-suggest-note">{s.note}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* A month or a year IS a range, and showing the resolved span is the
              quickest way to confirm "May 2022" was read as intended. */}
          <div className="xeplr-daterange-note">
            {props.single
              ? (props.singleParsed ? props.singleParsed.from + ' → ' + props.singleParsed.to : 'Not a date yet')
              : 'A day, a whole month, or a whole year.'}
          </div>
        </div>
      )}

      <div className="xeplr-daterange-foot">
        {/* Absent, not disabled, where the host cannot accept an empty
            selection — a control you can press that does nothing is worse
            than one that was never offered. */}
        {props.allowClear && (
          <button type="button" className="xeplr-daterange-clear" onClick={props.clear}>Clear</button>
        )}
        {props.label && <span className="xeplr-daterange-current">{props.label}</span>}
      </div>

      {props.inheritedLabel && !props.value && (
        <div className="xeplr-daterange-inherited">Using {props.inheritedLabel}</div>
      )}
    </div>
  );
}
