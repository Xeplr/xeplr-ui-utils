import { useDropdownController } from './useDropdownController.js';
import DropdownSample from './designs/DropdownSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { DROPDOWN_RULES } from './validateDesign.js';

export function DropdownPage(props) {
  var controller = useDropdownController(props);
  var ref = useDesignValidator('DropdownPage', DROPDOWN_RULES);
  return <div ref={ref}><DropdownSample {...controller} /></div>;
}
