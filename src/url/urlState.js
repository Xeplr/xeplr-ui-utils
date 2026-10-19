// WHERE YOU ARE LIVES IN THE URL — the pure half.
//
// Every screen state a person navigates to (an open editor or drawer, the
// selected record, the active tab or step, a dialog that is a place) is read
// from and written to the URL's query, so a refresh or a shared link lands on
// exactly the same screen. This file is the rule, with no React: how a patch
// of values becomes the next query string.
//
//   null / undefined / ''  → the key is removed (the default needs no URL)
//   true                   → '1'
//   anything else          → String(value)
//   a value equal to `defaults[key]` → removed too, so URLs stay short

export function patchSearch(search, patch, defaults) {
  const next = new URLSearchParams(search || '')
  Object.keys(patch || {}).forEach((k) => {
    let v = patch[k]
    if (v === true) v = '1'
    if (v === false || v === null || v === undefined || v === '' ||
        (defaults && defaults[k] !== undefined && String(defaults[k]) === String(v))) {
      next.delete(k)
    } else {
      next.set(k, String(v))
    }
  })
  return next
}

/** A query value read back: the string, or the default, or null. */
export function readSearch(params, key, fallback) {
  const v = params.get(key)
  return v === null || v === '' ? (fallback === undefined ? null : fallback) : v
}
