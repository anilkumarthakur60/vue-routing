import { collapseSlashes } from '@/path/normalize'
import { PARAM_PATTERN } from '@/path/params'

/** Value types accepted as route parameters. */
export type ParamValue = string | number | boolean

/**
 * A parameter input for URL generation: a single value, or  for repeatable
 * params (`:path*` / `:path+`)  an array of path segments.
 */
export type ParamValueInput = ParamValue | readonly ParamValue[]

/**
 * Encode a value for a repeatable (`*` / `+`) param: an array contributes one
 * path segment per element; a string is treated as a pre-joined path and
 * encoded per segment so its `/` separators survive.
 */
function encodeSegments(value: ParamValueInput): string {
  const segments = Array.isArray(value) ? value.map(String) : String(value).split('/')
  return segments.map(encodeURIComponent).join('/')
}

/**
 * Compile an absolute `:param` path into a concrete URL, substituting params
 * and appending any leftover params as a query string. Mirrors Laravel's
 * `route()` helper.
 *
 * Repeatable params (`:path*` / `:path+`, including the `/:pathMatch(.*)*`
 * fallback) accept an array (one segment per element) or a pre-joined string
 * (`'a/b'`), encoded per segment. A zero-or-more (`*`) param may be omitted
 * like an optional (`?`) one.
 *
 * @throws if a required parameter is missing, or has an empty value
 *   (`''` / `[]`)  silently generating a shorter, wrong URL would hide the
 *   bug at the call site (Laravel throws an `UrlGenerationException` too).
 */
export function compileUrl(pattern: string, params: Record<string, ParamValueInput> = {}): string {
  const used = new Set<string>()

  const path = pattern.replace(
    new RegExp(PARAM_PATTERN, 'g'),
    (_match, rawName: string, _regex: string | undefined, modifier: string) => {
      const value = params[rawName]
      // A provided-but-empty value is still consumed by the token  it must
      // not leak into the query string as `?name=`.
      if (value !== undefined) used.add(rawName)
      const optional = modifier === '?' || modifier === '*'
      if (value === undefined) {
        if (optional) return ''
        throw new Error(`Missing required parameter "${rawName}" for route "${pattern}".`)
      }
      if (value === '' || (Array.isArray(value) && value.length === 0)) {
        if (optional) return ''
        throw new Error(`Parameter "${rawName}" for route "${pattern}" must not be empty.`)
      }
      if (Array.isArray(value) || modifier === '*' || modifier === '+') {
        return encodeSegments(value)
      }
      return encodeURIComponent(String(value))
    },
  )

  const cleanPath = collapseSlashes(path) || '/'

  const query = Object.entries(params)
    .filter(([key]) => !used.has(key))
    .flatMap(([key, value]) => {
      const items = Array.isArray(value) ? value : [value]
      return items.map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
    })
    .join('&')

  return query ? `${cleanPath}?${query}` : cleanPath
}
