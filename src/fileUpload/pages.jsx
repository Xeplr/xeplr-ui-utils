import { useFileUploadController } from './useFileUploadController.js';
import FileUploadSample from './designs/FileUploadSample.jsx';
import { useDesignValidator, FILE_UPLOAD_RULES } from './validateDesign.js';

export function FileUploadPage(props) {
  var controller = useFileUploadController(props);
  var ref = useDesignValidator('FileUploadPage', FILE_UPLOAD_RULES);
  return <div ref={ref}><FileUploadSample {...controller} /></div>;
}
