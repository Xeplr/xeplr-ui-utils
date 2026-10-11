// ROWS AN IMPORT DROPPED — the ones the database refused — as the dropped-rows
// view shows them, copies them and counts them. Pure: no React, no fetch.
//
// The app's onLoadDropped(job) answers:
//   { columns: ['sku', 'qty'],                       // the file's own, in order
//     rows: [{ rowNum: 5, reason: '…', values: { sku: 'S5', qty: -1 } }],
//     total: 2,                                      // rows kept to look at
//     dropped: 2 }                                   // rows the import counted

/** How many rows a job or an import result dropped (either shape). */
export function droppedCount(job) {
  if (!job) return 0;
  var n = job.rowsDropped != null ? job.rowsDropped : job.dropped;
  return Number(n) || 0;
}

/**
 * The view's table: a row number, the reason, then the file's columns. Keys
 * are positional (c0, c1, …) because a column name can hold a dot, which a
 * table's accessor reads as a path.
 *
 * @returns {{ columns: [{ key, header }], rows: object[] }}
 */
export function droppedTable(data) {
  var names = (data && data.columns) || [];
  var columns = [{ key: 'rowNum', header: 'Row' }, { key: 'reason', header: 'Why it was dropped' }]
    .concat(names.map(function(name, i) { return { key: 'c' + i, header: name }; }));
  var rows = ((data && data.rows) || []).map(function(r) {
    var row = { rowNum: r.rowNum == null ? '' : r.rowNum, reason: r.reason || '' };
    names.forEach(function(name, i) { row['c' + i] = displayValue(r.values ? r.values[name] : null); });
    return row;
  });
  return { columns: columns, rows: rows };
}

function displayValue(v) {
  if (v == null) return '';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

/**
 * The rows as tab-separated text with a header — what Excel takes from the
 * clipboard as cells. The file's columns only, like the download: pasted,
 * fixed and saved, it imports again as it is. A value holding a tab, a line
 * break or a quote is quoted, its quotes doubled, as Excel itself copies it.
 */
export function droppedAsTsv(data) {
  var names = (data && data.columns) || [];
  var lines = [names.map(tsvCell).join('\t')];
  ((data && data.rows) || []).forEach(function(r) {
    lines.push(names.map(function(name) { return tsvCell(displayValue(r.values ? r.values[name] : null)); }).join('\t'));
  });
  return lines.join('\r\n');
}

export function tsvCell(value) {
  var s = value == null ? '' : String(value);
  return /[\t\r\n"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * What to say above the rows: the heading, and a note when not every dropped
 * row is here — the view shows the first ones, or the import predates rows
 * being kept and has only a count.
 */
export function droppedSummary(job, data) {
  var dropped = data && data.dropped != null ? Number(data.dropped) : droppedCount(job);
  var total = data ? Number(data.total) || 0 : 0;
  var shown = data && data.rows ? data.rows.length : 0;
  var heading = plural(dropped, 'row') + ' dropped' +
    (job && job.originalFileName ? ' from ' + job.originalFileName + (job.part ? ' (' + job.part + ')' : '') : '') +
    (job && job.target ? ' → ' + job.target : '');
  var note = null;
  if (data && total === 0 && dropped > 0) {
    note = 'These rows were not kept — this import ran before dropped rows were saved. Import the file again to see them.';
  } else if (data && total < dropped) {
    note = 'Only ' + plural(total, 'row') + ' of ' + dropped + ' were kept; the import stopped recording after too many failures in a row.';
  } else if (data && shown < total) {
    note = 'Showing the first ' + shown.toLocaleString() + ' of ' + total.toLocaleString() + '. Download has all of them.';
  }
  return { heading: heading, note: note };
}

function plural(n, word) {
  return Number(n).toLocaleString() + ' ' + word + (Number(n) === 1 ? '' : 's');
}
