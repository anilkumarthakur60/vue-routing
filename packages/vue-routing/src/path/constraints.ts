import { patterns, type PatternName } from '@/lib/constants'

/**
 * Build a `where`-style constraints map that applies one named built-in pattern
 * (`number`, `uuid`, …) to each of the given parameters. Shared by the group
 * (`RouteRegistrar`) and per-route (`RouteDefinition`) `whereX()` helpers.
 */
export function patternConstraints(
  params: readonly string[],
  pattern: PatternName,
): Record<string, string> {
  return Object.fromEntries(params.map((param): [string, string] => [param, patterns[pattern]]))
}

/**
 * Apply regex constraints to `:param` placeholders. Per-route `where` entries
 * take precedence over global patterns. A param already carrying an inline
 * regex (`:id(\d+)`) is left untouched.
 */
export function applyWhereConstraints(
  path: string,
  where: Record<string, string>,
  globalPatterns: Record<string, string> = {},
): string {
  const combined = { ...globalPatterns, ...where }
  let result = path
  for (const [param, pattern] of Object.entries(combined)) {
    // Match `:param` only when not already followed by `(` (an existing regex)
    // and not part of a longer identifier.
    result = result.replace(new RegExp(`:${param}(?![A-Za-z0-9_(])`, 'g'), `:${param}(${pattern})`)
  }
  return result
}
