import { useDateFieldController } from './useDateFieldController.js';
import DateFieldSample from './designs/DateFieldSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { DATE_FIELD_RULES } from './validateDesign.js';

export function DateFieldPage(props) {
  var controller = useDateFieldController(props);
  var ref = useDesignValidator('DateFieldPage', DATE_FIELD_RULES);
  return <div ref={ref}><DateFieldSample {...controller} /></div>;
}
