/** Common, reusable parameter-constraint patterns (Laravel's `whereNumber`, …). */
export const patterns = {
  number: '[0-9]+',
  alpha: '[A-Za-z]+',
  alphaNumeric: '[A-Za-z0-9]+',
  uuid: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
  ulid: '[0-7][0-9A-HJKMNP-TV-Z]{25}',
} as const

/** Name of a built-in constraint pattern. */
export type PatternName = keyof typeof patterns
