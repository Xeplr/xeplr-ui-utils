// File Upload — model
export { configureUpload, uploadFile } from './fileUpload/uploadFile.js';

// File Upload — controller
export { useFileUploadController } from './fileUpload/useFileUploadController.js';

// File Upload — design validation
export { useDesignValidator, FILE_UPLOAD_RULES } from './fileUpload/validateDesign.js';

// File Upload — sample design
export { FileUploadSample } from './fileUpload/designs/index.js';

// File Upload — ready-made page (controller + sample design wired)
export { FileUploadPage } from './fileUpload/pages.jsx';

// Snackbar
export { raiseSnackbar } from './snackbar/snackbar.js';

// Static data
export { default as COUNTRIES } from './data/countries.json';
import _statesData from './data/states.json';
export var STATES = _statesData.STATES;
export var STATES_IN = _statesData.STATES_IN;
