import { useGridDisplayerController } from './useGridDisplayerController.js';
import GridDisplayerSample from './designs/GridDisplayerSample.jsx';
import { useDesignValidator } from '../fileUpload/validateDesign.js';
import { GRID_DISPLAYER_RULES } from './validateDesign.js';

export function GridDisplayerPage(props) {
  var controller = useGridDisplayerController(props);
  var ref = useDesignValidator('GridDisplayerPage', GRID_DISPLAYER_RULES);
  return <div ref={ref}><GridDisplayerSample {...controller} /></div>;
}
