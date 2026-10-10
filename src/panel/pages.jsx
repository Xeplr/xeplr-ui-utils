import { useExpandersController } from './useExpandersController.js';
import { useSettingsTreeController } from './useSettingsTreeController.js';
import ExpandersSample from './designs/ExpandersSample.jsx';
import SettingsTreeSample from './designs/SettingsTreeSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { EXPANDERS_RULES, SETTINGS_TREE_RULES } from './validateDesign.js';

export function ExpandersPage(props) {
  var controller = useExpandersController(props);
  var ref = useDesignValidator('ExpandersPage', EXPANDERS_RULES);
  return <div ref={ref}><ExpandersSample {...controller} /></div>;
}

export function SettingsTreePage(props) {
  var controller = useSettingsTreeController(props);
  var ref = useDesignValidator('SettingsTreePage', SETTINGS_TREE_RULES);
  return <div ref={ref}><SettingsTreeSample {...controller} /></div>;
}
