// WHAT A SCHEMA FIELD IS CALLED ON SCREEN.
//
// A field's name is written for the action's code. Showing it raw put
// "connectionInfoId", "dbInfoId", "streaming_mode" and "batchSize" in front of
// people as though those were English. A field may carry its own `label`;
// this is the fallback, good enough that most fields never need one.
// `Id` / `Info` are suffixes of the storage, not of the thing: you pick a
// Connection, not a connectionInfoId.
//
// One copy, used by @xeplr/ui-jobs' job editor and X-Flow's step editor.
// Pure: no React.

const LABEL_WORDS = { db: 'Database', sql: 'SQL', url: 'URL', id: 'ID', api: 'API', http: 'HTTP', ms: '(ms)' }

export function fieldLabel(field) {
  if (!field) return ''
  if (field.label) return field.label
  return String(field.name || '')
    .replace(/Id$/, '')
    .replace(/Info$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(' ')
    .map((w, i) => {
      const known = LABEL_WORDS[w.toLowerCase()]
      if (known) return known
      return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toLowerCase()
    })
    .join(' ')
}
