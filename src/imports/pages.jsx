import { useImportsController } from './useImportsController.js';
import ImportsSample from './designs/ImportsSample.jsx';
import { IMPORTS_RULES } from './validateDesign.js';
import { useDesignValidator } from '../dataImport/validateDesign.js';
import { DataImportPage, ImportHistoryPage } from '../dataImport/pages.jsx';

/**
 * The whole import feature against @xeplr/imports, ready to route to:
 *
 *   <Route path="/upload" element={<ImportsPage basePath="/api/imports" />} />
 *
 * Requests carry the headers given to configureUpload (sign-in, tenancy).
 */
export function ImportsPage(props) {
  var c = useImportsController(props);
  var ref = useDesignValidator('ImportsPage', IMPORTS_RULES);
  return (
    <div ref={ref}>
      <ImportsSample {...c}
        importSection={<DataImportPage accept=".csv,.json,.xlsx,.xls" targetLabel="Table name" {...c.importProps} />}
        historySection={<ImportHistoryPage key={c.historyVersion} {...c.historyProps} />} />
    </div>
  );
}
