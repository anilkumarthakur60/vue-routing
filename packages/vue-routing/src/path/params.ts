/** Route-parameter parsing and Laravel→vue-router conversion. Pure functions. */

/**
 * Regex source matching a vue-router param token: `:name`, an optional inline
 * regex (`:name(\\d+)`), and an optional modifier — `?` (optional), `*`
 * (zero-or-more repeatable, e.g. the `/:pathMatch(.*)*` fallback), `+`
 * (one-or-more repeatable).
 */
export const PARAM_PATTERN = ':([A-Za-z0-9_]+)(\\([^)]*\\))?([?+*]?)'

/**
 * Convert Laravel-style braces to vue-router colon params:
 * - `{id}`         → `:id`
 * - `{id?}`        → `:id?`       (optional)
 * - `{post:slug}`  → `:post`      (custom key — column handled by bindings)
 * - `{post:slug?}` → `:post?`     (optional custom key)
 *
 * Already-colon (`:id`) syntax is left untouched, so both styles interoperate.
 */
export function convertLaravelParams(path: string): string {
  return path
    .replace(/\{(\w+):\w+\?\}/g, ':$1?')
    .replace(/\{(\w+)\?\}/g, ':$1?')
    .replace(/\{(\w+):\w+\}/g, ':$1')
    .replace(/\{(\w+)\}/g, ':$1')
}

/** Extract the custom binding column from each `{param:column}` segment. */
export function extractBindingFields(path: string): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const match of path.matchAll(/\{(\w+):(\w+)\??\}/g)) {
    const param = match[1]
    const column = match[2]
    if (param !== undefined && column !== undefined) fields[param] = column
  }
  return fields
}

/** A vue-router param token parsed from a compiled path. */
export interface ParamToken {
  name: string
  /** True when the URL may omit the param (`?` or zero-or-more `*`). */
  optional: boolean
}

/** List the parameter tokens present in a compiled (`:param`) path. */
export function extractParamNames(path: string): ParamToken[] {
  const tokens: ParamToken[] = []
  for (const match of path.matchAll(new RegExp(PARAM_PATTERN, 'g'))) {
    const name = match[1]
    const modifier = match[3]
    if (name !== undefined) {
      tokens.push({ name, optional: modifier === '?' || modifier === '*' })
    }
  }
  return tokens
}
