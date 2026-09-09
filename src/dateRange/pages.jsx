import { useDateRangeController } from './useDateRangeController.js';
import DateRangeSample from './designs/DateRangeSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { DATE_RANGE_RULES } from './validateDesign.js';

export function DateRangePage(props) {
  var controller = useDateRangeController(props);
  var ref = useDesignValidator('DateRangePage', DATE_RANGE_RULES);
  return <div ref={ref}><DateRangeSample {...controller} /></div>;
}
