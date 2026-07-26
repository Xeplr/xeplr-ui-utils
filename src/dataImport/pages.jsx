import { useDataImportController } from './useDataImportController.js';
import { useImportHistoryController } from './useImportHistoryController.js';
import DataImportSample from './designs/DataImportSample.jsx';
import ImportHistorySample from './designs/ImportHistorySample.jsx';
import { useDesignValidator, DATA_IMPORT_RULES, IMPORT_HISTORY_RULES } from './validateDesign.js';

export function DataImportPage(props) {
  var controller = useDataImportController(props);
  var ref = useDesignValidator('DataImportPage', DATA_IMPORT_RULES);
  return <div ref={ref}><DataImportSample {...controller} /></div>;
}

export function ImportHistoryPage(props) {
  var controller = useImportHistoryController(props);
  var ref = useDesignValidator('ImportHistoryPage', IMPORT_HISTORY_RULES);
  return <div ref={ref}><ImportHistorySample {...controller} /></div>;
}
