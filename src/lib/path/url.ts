import { collapseSlashes } from '@/lib/path/normalize'
import { PARAM_PATTERN } from '@/lib/path/params'

/** Value types accepted as route parameters. */
export type ParamValue = string | number | boolean

/**
 * Compile an absolute `:param` path into a concrete URL, substituting params
 * and appending any leftover params as a query string. Mirrors Laravel's
 * `route()` helper.
 *
 * @throws if a required parameter has no value.
 */
export function compileUrl(pattern: string, params: Record<string, ParamValue> = {}): string {
  const used = new Set<string>()

  const path = pattern.replace(
    new RegExp(PARAM_PATTERN, 'g'),
    (_match, rawName: string, _regex, optional: string) => {
      const value = params[rawName]
      if (value !== undefined) {
        used.add(rawName)
        return encodeURIComponent(String(value))
      }
      if (optional === '?') return ''
      throw new Error(`Missing required parameter "${rawName}" for route "${pattern}".`)
    },
  )

  const cleanPath = collapseSlashes(path) || '/'

  const query = Object.entries(params)
    .filter(([key, value]) => !used.has(key) && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return query ? `${cleanPath}?${query}` : cleanPath
}
