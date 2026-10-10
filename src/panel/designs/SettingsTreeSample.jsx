import './settingsTree.css';

function Chevron() {
  return (
    <svg className="xeplr-tree-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Node(props) {
  var n = props.node;
  var top = n.depth === 0;
  return (
    <div className={'xeplr-tree-node ' + (top ? 'xeplr-tree-group' : 'xeplr-tree-item') + (n.open ? ' open' : '')}
      data-depth={n.depth}>
      <button type="button" className="xeplr-tree-head" aria-expanded={n.open}
        onClick={function() { props.toggle(n.parentKey, n.key); }}>
        {!top && <span className="xeplr-tree-dot" aria-hidden="true" />}
        {n.icon && <span className={top ? 'xeplr-tree-tile' : 'xeplr-tree-icon'} aria-hidden="true">{n.icon}</span>}
        <span className="xeplr-tree-title">{n.title}</span>
        {n.count ? <span className="xeplr-tree-count">{n.count}</span> : null}
        <Chevron />
      </button>
      {n.open && (n.content || n.children) && (
        <div className="xeplr-tree-body">
          {n.content && <div className="xeplr-tree-content">{n.content}</div>}
          {n.children && (
            <div className="xeplr-tree-children">
              {n.children.map(function(c) { return <Node key={c.key} node={c} toggle={props.toggle} />; })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SettingsTree — design. Top-level groups are cards (an icon tile, a title,
 * how many settings are set, a chevron); an open group is tinted with an
 * accent bar, its branches listed on a dotted rail. Everything from
 * useSettingsTreeController.
 */
export default function SettingsTreeSample(props) {
  return (
    <div className="xeplr-tree">
      {props.nodes.map(function(n) { return <Node key={n.key} node={n} toggle={props.toggle} />; })}
    </div>
  );
}
