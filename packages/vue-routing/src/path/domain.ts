/**
 * Subdomain-pattern helpers — turn a Laravel-style `{account}.example.com`
 * pattern into a real matcher. Pure functions, shared by the navigation guard
 * (host validation) and the `useSubdomainParams` composable (host extraction)
 * so the regex-escaping logic lives in exactly one place.
 */

/** Matches a `{param}` token in a domain pattern. */
const PARAM_TOKEN = /\{(\w+)\}/g

/** Escapes regex-special characters so literal parts match literally. */
function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The ordered parameter names declared in a domain pattern. */
export function domainParamNames(domain: string): string[] {
  return [...domain.matchAll(PARAM_TOKEN)]
    .map((match) => match[1])
    .filter((name): name is string => name !== undefined)
}

/**
 * Compile a domain pattern into an anchored `RegExp`. Literal characters
 * (notably the dots in `example.com`) are escaped; each `{param}` becomes a
 * single-label capture group (`[^.]+`). Matching is case-insensitive — DNS
 * hostnames are case-insensitive and `window.location.hostname` is always
 * lowercase, so an uppercase letter in the pattern must not break matching.
 */
export function domainToRegExp(domain: string): RegExp {
  // Escape first, which turns each `{param}` into `\{param\}`, then swap those
  // escaped tokens for capture groups.
  const source = escapeRegExp(domain).replace(/\\\{(\w+)\\\}/g, '([^.]+)')
  return new RegExp(`^${source}$`, 'i')
}

/**
 * Extract the subdomain params from `hostname` for the given domain pattern,
 * or `null` when the hostname does not satisfy the pattern.
 */
export function matchDomain(domain: string, hostname: string): Record<string, string> | null {
  const result = domainToRegExp(domain).exec(hostname)
  if (!result) return null

  const params: Record<string, string> = {}
  domainParamNames(domain).forEach((name, index) => {
    const captured = result[index + 1]
    if (captured !== undefined) params[name] = captured
  })
  return params
}
