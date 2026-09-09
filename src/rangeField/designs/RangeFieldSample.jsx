import DateFieldSample from '../../dateField/designs/DateFieldSample.jsx';
import './rangeField.css';

/**
 * RangeField — design. From and To rendered as ONE field, side by side,
 * sharing a row — not two independent fields that happen to sit near each
 * other. That's the actual point of this component: a caller reaching for
 * "start" and "end" as two separate labeled boxes gets visual distance
 * between two things that are really one idea; this gives them the one idea.
 */
export default function RangeFieldSample({ fromLabel, toLabel, from, to }) {
  return (
    <div className="xeplr-rangefield">
      <div className="xeplr-rangefield-field">
        <span className="xeplr-rangefield-label">{fromLabel}</span>
        <DateFieldSample {...from} />
      </div>
      <span className="xeplr-rangefield-sep" aria-hidden="true">→</span>
      <div className="xeplr-rangefield-field">
        <span className="xeplr-rangefield-label">{toLabel}</span>
        <DateFieldSample {...to} />
      </div>
    </div>
  );
}
