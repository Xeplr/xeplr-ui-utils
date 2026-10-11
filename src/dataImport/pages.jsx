import { useDataImportController } from './useDataImportController.js';
import { useImportHistoryController } from './useImportHistoryController.js';
import { useDroppedRowsController } from './useDroppedRowsController.js';
import DataImportSample from './designs/DataImportSample.jsx';
import ImportHistorySample from './designs/ImportHistorySample.jsx';
import DroppedRowsSample from './designs/DroppedRowsSample.jsx';
import { useDesignValidator, DATA_IMPORT_RULES, IMPORT_HISTORY_RULES, DROPPED_ROWS_RULES } from './validateDesign.js';

// Props: onInspect, onCommit, … and, to show the rows an import dropped,
// onLoadDropped(job) and onDownloadDropped(job) (see useDroppedRowsController).
export function DataImportPage(props) {
  var controller = useDataImportController(props);
  var dropped = useDroppedRowsController(props);
  var ref = useDesignValidator('DataImportPage', DATA_IMPORT_RULES);
  return (
    <div ref={ref}>
      <DataImportSample {...controller} canViewDropped={dropped.canView} viewDropped={dropped.open} />
      {dropped.job && <DroppedRowsPage {...dropped} />}
    </div>
  );
}

export function ImportHistoryPage(props) {
  var controller = useImportHistoryController(props);
  var dropped = useDroppedRowsController(props);
  var ref = useDesignValidator('ImportHistoryPage', IMPORT_HISTORY_RULES);
  return (
    <div ref={ref}>
      <ImportHistorySample {...controller} canViewDropped={dropped.canView} viewDropped={dropped.open} />
      {dropped.job && <DroppedRowsPage {...dropped} />}
    </div>
  );
}

// The dropped-rows dialog, validated as it opens — its required buttons only
// exist while it is on screen.
export function DroppedRowsPage(props) {
  var ref = useDesignValidator('DroppedRows', DROPPED_ROWS_RULES);
  return <div ref={ref}><DroppedRowsSample {...props} /></div>;
}
