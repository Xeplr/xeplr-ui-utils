// WHERE A KIND OF THING IS LISTED, for an input that says `optionsFrom`.
//
// An action's input can name a KIND of thing to choose from
// (`optionsFrom: 'connections'`), and the host says once where that kind
// lives: { connections: { url: '/connectioninfo', value: 'id', label: 'label' } }.
// A screen then offers a list to pick from instead of a box to type a
// 25-character id into. This module never learns what a connection is, nor
// which URL serves one: it knows only "fetch this list, show labels, store ids".
//
// One copy, used by @xeplr/ui-jobs' job editor and X-Flow's step editor.
//
// Nothing configured for a kind → `has(kind)` is false, and the screen shows a
// plain text box: an empty dropdown looks broken, a text box is simply what
// you have when there is no catalogue to pick from.
//
// Pure: no React. `fetchJson(path)` is the host's own authenticated fetch
// (@xeplr/ui-account's authFetch), so this package never learns about logins.

/**
 * @param {object} sources    { kind: { url, value?='id', label?, key?='dataArray', where? } }
 * @param {Function} fetchJson (path) → Promise of the parsed answer
 */
// `where`: only rows with these values, e.g. { connectionType: 'api' } so a
// step that calls an API lists API connections and not database ones. Sent as
// query values, and checked again here for an endpoint that ignores them.
function whereQuery(src) {
  return Object.entries(src.where || {}).map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('')
}
function matchesWhere(src, row) {
  return Object.entries(src.where || {}).every(([k, v]) => row[k] === v)
}

export function createOptionSources(sources, fetchJson) {
  const all = sources || {}

  function has(kind) {
    return Boolean(kind && all[kind])
  }

  /**
   * One list, as [{ value, label }]. `filter` narrows a dependent list — the
   * databases on the chosen connection — as a query parameter, and, with
   * `clientKey`, again in the browser for an endpoint that ignores it.
   */
  async function fetchOptions(kind, filter) {
    const src = all[kind]
    if (!src) return []
    const q = (filter && filter.value ? `&${encodeURIComponent(filter.name)}=${encodeURIComponent(filter.value)}` : '') + whereQuery(src)
    const res = await fetchJson(`${src.url}?limit=0${q}`)
    // `dataArray` is what a generic route answers; a hand-written endpoint
    // answers with its own key, which the host names. Guessing wrong would
    // give an empty list and no error, which reads as "you have none".
    const rows = (res && res[src.key || 'dataArray']) || []
    return rows
      .filter((r) => matchesWhere(src, r))
      .filter((r) => (filter && filter.clientKey ? r[filter.clientKey] === filter.value : true))
      .map((r) => ({ value: r[src.value || 'id'], label: r[src.label] || r[src.value || 'id'] }))
  }

  /**
   * Suggestions asked with several values at once (`query` is { param: value }),
   * as a list of strings. Empty when the source is not configured or something
   * it needs is not chosen yet.
   */
  async function fetchSuggestions(kind, query) {
    const src = all[kind]
    if (!src) return []
    const pairs = Object.entries(query || {})
    if (pairs.some(([, v]) => v === undefined || v === null || v === '')) return []
    const q = pairs.map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('')
    const res = await fetchJson(`${src.url}?limit=0${q}`)
    const list = (res && res[src.key || 'dataArray']) || []
    return list.map((o) => String(o[src.value || 'value'])).filter(Boolean)
  }

  return { has, fetchOptions, fetchSuggestions }
}
