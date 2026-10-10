import './panel.css';

/**
 * A card that groups one part of a settings panel: an icon, a title, an
 * optional line under it, and the rows. Presentation only.
 */
export function PanelSection(props) {
  return (
    <section className={'xeplr-panel-section' + (props.className ? ' ' + props.className : '')}>
      {(props.title || props.icon) && (
        <header className="xeplr-panel-section-head">
          {props.icon && <span className="xeplr-panel-section-icon" aria-hidden="true">{props.icon}</span>}
          <div className="xeplr-panel-section-titles">
            <h3 className="xeplr-panel-section-title">{props.title}</h3>
            {props.subtitle && <div className="xeplr-panel-section-subtitle">{props.subtitle}</div>}
          </div>
          {props.actions && <div className="xeplr-panel-section-actions">{props.actions}</div>}
        </header>
      )}
      <div className="xeplr-panel-section-body">{props.children}</div>
    </section>
  );
}

/**
 * One row of a panel: the label on the left, the control on the right, and a
 * line of help under the control. `stacked` puts the control under the label,
 * for a control too wide to share the line (a colour picker).
 */
export function PanelField(props) {
  return (
    <div className={'xeplr-panel-field' + (props.stacked ? ' xeplr-panel-field-stacked' : '')}>
      <label className="xeplr-panel-field-label" htmlFor={props.htmlFor}>
        {props.label}
        {props.badge && <span className="xeplr-panel-field-badge">{props.badge}</span>}
      </label>
      <div className="xeplr-panel-field-control">
        {props.children}
        {props.help && <div className="xeplr-panel-field-help">{props.help}</div>}
      </div>
    </div>
  );
}
