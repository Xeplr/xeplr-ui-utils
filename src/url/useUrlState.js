import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { patchSearch, readSearch } from './urlState.js'

/**
 * Read and write screen state in the URL's query (see urlState.js).
 *
 *   const url = useUrlParams({ tab: 'canvas' })
 *   url.get('tab')                      → 'canvas' when absent
 *   url.set({ drawer: 'filters' })      → opens: a new history entry
 *   url.set({ tab: 'model' }, { replace: true })   → switching: no entry
 *
 * The rule the suite follows: OPENING or CLOSING something adds a history
 * entry, so Back closes it; switching a tab or step, or typing, replaces it,
 * so Back is not a keystroke undo.
 *
 * Needs react-router-dom (a peer of whatever app uses it). Imported from
 * '@xeplr/ui-utils/src/url/useUrlState.js' rather than the package root, so a
 * consumer without a router is not made to install one.
 */
export function useUrlParams(defaults) {
  const [params, setParams] = useSearchParams()
  const get = useCallback((key) => readSearch(params, key, defaults ? defaults[key] : undefined), [params, defaults])
  const set = useCallback((patch, opts) => {
    setParams((prev) => patchSearch(prev, patch, defaults), { replace: Boolean(opts && opts.replace) })
  }, [setParams, defaults])
  return { get: get, set: set, params: params }
}

/**
 * One value in the URL, as a [value, setValue] pair — useState's shape.
 * `opts.replace` makes every change replace the history entry (a tab); the
 * default adds one (an open panel). `opts.default` is what absence means.
 */
export function useUrlState(key, opts) {
  const o = opts || {}
  const [params, setParams] = useSearchParams()
  const value = readSearch(params, key, o.default)
  const setValue = useCallback((v, callOpts) => {
    const replace = callOpts && callOpts.replace !== undefined ? callOpts.replace : Boolean(o.replace)
    setParams((prev) => {
      const current = readSearch(prev, key, o.default)
      const next = typeof v === 'function' ? v(current) : v
      const defaults = o.default !== undefined ? { [key]: o.default } : undefined
      return patchSearch(prev, { [key]: next }, defaults)
    }, { replace: replace })
  }, [setParams, key, o.default, o.replace])
  return [value, setValue]
}
