/**
 * Build the alternation pattern for `whereIn()`. Each value is escaped so
 * regex metacharacters match literally — `whereIn('ext', ['a.b'])` must not
 * let `.` act as a wildcard (or `(`/`|` corrupt the whole path pattern).
 */
export function whereInPattern(values: readonly string[]): string {
  return values.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
}
