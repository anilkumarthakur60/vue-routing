/**
 * Append a route-name segment to an existing name prefix, inserting a `.`
 * separator unless the prefix already ends with one (Laravel `name()` semantics).
 */
export function appendRouteName(prefix: string, segment: string): string {
  if (!prefix) return segment
  return prefix.endsWith('.') ? `${prefix}${segment}` : `${prefix}.${segment}`
}
