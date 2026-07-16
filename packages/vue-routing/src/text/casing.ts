/** String casing utilities. Pure functions. */

/** Split camelCase, PascalCase, kebab-case, or snake_case into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.toLowerCase())
}

/** Naive English pluralization covering the common cases. */
export function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return word.replace(/y$/i, 'ies')
  if (/(?:fe|f)$/i.test(word)) return word.replace(/(?:fe|f)$/i, 'ves')
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`
  if (/[aeiou]o$/i.test(word)) return `${word}s`
  if (/o$/i.test(word)) return `${word}es`
  return `${word}s`
}

/**
 * Naive English singularization — the inverse of {@link pluralize}, covering the
 * common cases (used to derive a resource's route parameter, e.g.
 * `users` → `user`, `categories` → `category`). Pass `parameters` to
 * `resource()` to override irregular cases.
 */
export function singularize(word: string): string {
  if (/ies$/i.test(word)) return word.replace(/ies$/i, 'y')
  if (/ves$/i.test(word)) return word.replace(/ves$/i, 'f')
  if (/(?:sses|shes|ches|xes|zes)$/i.test(word)) return word.replace(/es$/i, '')
  if (/[^aeiou]oes$/i.test(word)) return word.replace(/es$/i, '')
  if (/ss$/i.test(word)) return word
  if (/s$/i.test(word)) return word.replace(/s$/i, '')
  return word
}
