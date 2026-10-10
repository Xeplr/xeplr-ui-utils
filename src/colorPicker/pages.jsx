import { useColorPickerController } from './useColorPickerController.js';
import ColorPickerSample from './designs/ColorPickerSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { COLOR_PICKER_RULES } from './validateDesign.js';

export function ColorPickerPage(props) {
  var controller = useColorPickerController(props);
  var ref = useDesignValidator('ColorPickerPage', COLOR_PICKER_RULES);
  return <div ref={ref}><ColorPickerSample {...controller} /></div>;
}
