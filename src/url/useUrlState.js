import { useCallback, useState } from 'react'
import { useInRouterContext, useSearchParams } from 'react-router-dom'
import { patchSearch, readSearch, writeFrom, pendingBase } from './urlState.js'

// THE QUERY A WRITE STARTS FROM — the LIVE one. react-router builds each
// setSearchParams from the query the last render saw, so a write from a
// handler whose closure predates another write — after an `await`, or a
// second write in the same click — would put back what that write removed (a
// closed dialog reopening itself). When the router mirrors the browser's
// address (BrowserRouter), the address bar is the latest query there is; a
// router that does not (MemoryRouter in a test) falls back to chaining writes
// within one render (writeFrom).
function liveBase(rendered, mirrorsBrowser) {
  if (mirrorsBrowser && typeof window !== 'undefined') return new URLSearchParams(window.location.search)
  return pendingBase(rendered)
}

function mirrors(params) {
  return typeof window !== 'undefined' && window.location && ('?' + params.toString()).replace(/^\?$/, '') === window.location.search.replace(/^\?$/, '')
}

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
export function useUrlParams(defaults, options) {
  // IN MEMORY, with the very same rules, when there is no router above (a
  // component that promises to work without one) or the caller says so
  // (`inUrl: false`: an editor embedded in a page whose URL — and keys —
  // belong to that page). Whether a router is there does not change during a
  // component's life, so the hook order below is stable.
  const inRouter = useInRouterContext()
  const inUrl = inRouter && !(options && options.inUrl === false)
  const [local, setLocal] = useState(() => new URLSearchParams())
  // eslint-disable-next-line react-hooks/rules-of-hooks -- fixed per component (see above)
  const router = inRouter ? useSearchParams() : [null, null]
  const params = inUrl ? router[0] : local
  const setParams = router[1]
  // Decided at RENDER, when the router's query and the address bar can be
  // compared like for like — by the time a handler runs, an earlier write may
  // already have moved the address on.
  const browserBacked = inUrl && mirrors(params)
  const get = useCallback((key) => readSearch(params, key, defaults ? defaults[key] : undefined), [params, defaults])
  const set = useCallback((patch, opts) => {
    if (!inUrl) { setLocal((prev) => patchSearch(prev, patch, defaults)); return }
    const base = liveBase(params, browserBacked)
    const next = browserBacked ? patchSearch(base, patch, defaults) : writeFrom(params, patch, defaults)
    if (next.toString() === base.toString()) return
    setParams(next, { replace: Boolean(opts && opts.replace) })
  }, [inUrl, browserBacked, params, setParams, defaults])
  return { get: get, set: set, params: params, inUrl: inUrl, browserBacked: browserBacked }
}

/**
 * One value in the URL, as a [value, setValue] pair — useState's shape.
 * `opts.replace` makes every change replace the history entry (a tab); the
 * default adds one (an open panel). `opts.default` is what absence means.
 */
export function useUrlState(key, opts) {
  const o = opts || {}
  const defaults = o.default !== undefined ? { [key]: o.default } : undefined
  const url = useUrlParams(defaults, { inUrl: o.inUrl })
  const value = url.get(key)
  const live = url.params
  const set = url.set
  const setValue = useCallback((v, callOpts) => {
    const replace = callOpts && callOpts.replace !== undefined ? callOpts.replace : Boolean(o.replace)
    const current = typeof v === 'function'
      ? readSearch(url.inUrl ? liveBase(live, url.browserBacked) : live, key, o.default)
      : null
    set({ [key]: typeof v === 'function' ? v(current) : v }, { replace: replace })
  }, [set, live, url.inUrl, url.browserBacked, key, o.default, o.replace])
  return [value, setValue]
}
