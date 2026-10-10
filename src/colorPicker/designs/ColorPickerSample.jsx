import './colorPicker.css';

/**
 * ColorPicker — design. Presentation only; everything from
 * useColorPickerController. Swatches, "no colour", a custom colour, opacity
 * as a slider and a number, and a live preview of the result.
 */
export default function ColorPickerSample(props) {
  return (
    <div className="xeplr-colorpicker-wrap">
      <div className="xeplr-colorpicker">
        <div className="xeplr-colorpicker-main">
          {props.label && <div className="xeplr-colorpicker-label">{props.label}</div>}
          <div className="xeplr-colorpicker-swatches" role="listbox" aria-label={props.label || 'Colour'}>
            {props.allowNone && (
              <button type="button" role="option" aria-selected={!props.value} title="No colour"
                className={'xeplr-colorpicker-swatch xeplr-colorpicker-none' + (!props.value ? ' selected' : '')}
                onClick={props.clear}>
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M4 12 12 4" stroke="currentColor" strokeWidth="1.5" /></svg>
              </button>
            )}
            {props.swatches.map(function(s) {
              return (
                <button key={s.color} type="button" role="option" aria-selected={s.selected} title={s.color}
                  className={'xeplr-colorpicker-swatch' + (s.selected ? ' selected' : '')}
                  style={{ background: s.color }} onClick={function() { props.pick(s.color); }} />
              );
            })}
            <label className={'xeplr-colorpicker-swatch xeplr-colorpicker-custom' + (props.custom ? ' selected' : '')}
              title="Another colour" style={props.custom ? { background: props.hex } : undefined}>
              {!props.custom && <span aria-hidden="true">+</span>}
              <input type="color" value={props.hex || '#4f7cff'} onChange={function(e) { props.pick(e.target.value); }} aria-label="Another colour" />
            </label>
          </div>
          {props.allowOpacity && (
            <div className="xeplr-colorpicker-opacity">
              <span className="xeplr-colorpicker-label">Opacity</span>
              <div className="xeplr-colorpicker-opacity-row">
                <input type="range" min="0" max="100" value={props.opacity} disabled={!props.value}
                  onChange={function(e) { props.setOpacity(Number(e.target.value)); }} aria-label="Opacity" />
                <span className="xeplr-colorpicker-opacity-value">
                  <input type="number" min="0" max="100" value={props.opacity} disabled={!props.value}
                    onChange={function(e) { props.setOpacity(Number(e.target.value)); }} aria-label="Opacity percent" />%
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="xeplr-colorpicker-preview">
          <span className="xeplr-colorpicker-label">Preview</span>
          <div className="xeplr-colorpicker-preview-box" style={props.value ? { background: props.value } : undefined}>{props.previewText}</div>
        </div>
      </div>
    </div>
  );
}
