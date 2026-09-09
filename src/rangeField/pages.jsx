import { useRangeFieldController } from './useRangeFieldController.js';
import RangeFieldSample from './designs/RangeFieldSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { RANGE_FIELD_RULES } from './validateDesign.js';

export function RangeFieldPage(props) {
  var controller = useRangeFieldController(props);
  var ref = useDesignValidator('RangeFieldPage', RANGE_FIELD_RULES);
  return <div ref={ref}><RangeFieldSample {...controller} /></div>;
}
