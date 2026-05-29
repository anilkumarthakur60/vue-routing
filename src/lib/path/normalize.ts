/** Pure path-normalization helpers. No side effects. */

/** Collapse repeated slashes and drop a trailing slash (except for root). */
export function collapseSlashes(path: string): string {
  const collapsed = path.replace(/\/{2,}/g, '/')
  return collapsed.length > 1 && collapsed.endsWith('/') ? collapsed.slice(0, -1) : collapsed
}

/** Ensure a non-empty segment has a leading slash; empty becomes root. */
export function ensureLeadingSlash(path: string): string {
  if (path === '') return '/'
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Join URI segments into a single absolute path. Empty and bare-`/` segments
 * are skipped; the result is slash-collapsed.
 */
export function joinPaths(...segments: string[]): string {
  const joined = segments
    .filter((segment) => segment !== '' && segment !== '/')
    .map(ensureLeadingSlash)
    .join('')
  return joined === '' ? '/' : collapseSlashes(joined)
}
