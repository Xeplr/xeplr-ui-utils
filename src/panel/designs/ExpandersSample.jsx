import './panel.css';

/**
 * Expanders — design. Each item a header (icon, title, a short summary of
 * what is set) that opens its content. Everything from useExpandersController.
 */
export default function ExpandersSample(props) {
  return (
    <div className="xeplr-expanders">
      {props.items.map(function(item) {
        var id = 'xeplr-expander-' + item.key;
        return (
          <div key={item.key} className={'xeplr-expander' + (item.open ? ' open' : '')}>
            <button type="button" className="xeplr-expander-head" aria-expanded={item.open} aria-controls={id}
              onClick={function() { props.toggle(item.key); }}>
              {item.icon && <span className="xeplr-expander-icon" aria-hidden="true">{item.icon}</span>}
              <span className="xeplr-expander-title">{item.title}</span>
              {item.summary && <span className="xeplr-expander-summary">{item.summary}</span>}
              <svg className="xeplr-expander-chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {item.open && <div className="xeplr-expander-body" id={id}>{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
