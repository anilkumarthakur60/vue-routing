/**
 * Build the alternation pattern for `whereIn()`. Each value is escaped so
 * regex metacharacters match literally — `whereIn('ext', ['a.b'])` must not
 * let `.` act as a wildcard (or `(`/`|` corrupt the whole path pattern).
 * An empty list would compile to the broken constraint `:param()` — reject it
 * eagerly with an actionable error instead.
 */
export function whereInPattern(values: readonly string[]): string {
  if (values.length === 0) {
    throw new Error('whereIn() requires at least one value.')
  }
  return values.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
}
