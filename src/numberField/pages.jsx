import { useNumberFieldController } from './useNumberFieldController.js';
import NumberFieldSample from './designs/NumberFieldSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { NUMBER_FIELD_RULES } from './validateDesign.js';

export function NumberFieldPage(props) {
  var controller = useNumberFieldController(props);
  var ref = useDesignValidator('NumberFieldPage', NUMBER_FIELD_RULES);
  return <div ref={ref}><NumberFieldSample {...controller} /></div>;
}
