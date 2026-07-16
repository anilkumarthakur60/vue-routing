/** Route-parameter parsing and Laravel→vue-router conversion. Pure functions. */

/** Regex source matching a vue-router param: `:name`, `:name(regex)`, `:name?`. */
export const PARAM_PATTERN = ':([A-Za-z0-9_]+)(\\([^)]*\\))?(\\??)'

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
  optional: boolean
}

/** List the parameter tokens present in a compiled (`:param`) path. */
export function extractParamNames(path: string): ParamToken[] {
  const tokens: ParamToken[] = []
  for (const match of path.matchAll(new RegExp(PARAM_PATTERN, 'g'))) {
    const name = match[1]
    if (name !== undefined) tokens.push({ name, optional: match[3] === '?' })
  }
  return tokens
}
