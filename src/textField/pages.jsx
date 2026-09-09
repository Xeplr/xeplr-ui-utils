import { useTextFieldController } from './useTextFieldController.js';
import TextFieldSample from './designs/TextFieldSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { TEXT_FIELD_RULES } from './validateDesign.js';

export function TextFieldPage(props) {
  var controller = useTextFieldController(props);
  var ref = useDesignValidator('TextFieldPage', TEXT_FIELD_RULES);
  return <div ref={ref}><TextFieldSample {...controller} /></div>;
}
