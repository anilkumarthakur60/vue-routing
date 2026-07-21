/** Owns the named-route map and named-route URL generation. */
import type { NamedRouteEntry } from '@/types'
import {
  compileUrl,
  domainParamNames,
  extractParamNames,
  type ParamValue,
  type ParamValueInput,
} from '@/path'

export class NameRegistry {
  private readonly entries = new Map<string, NamedRouteEntry>()

  /**
   * Register a name. A true collision (same name, different path) throws —
   * names must be unique. Re-registering the identical (name, path) pair
   * replaces the previous entry with a dev-time warning instead of throwing,
   * so route modules can survive re-evaluation (Vite SSR dev, HMR, tests
   * importing the same routes file twice).
   */
  public register(name: string, entry: NamedRouteEntry): void {
    const existing = this.entries.get(name)
    if (existing) {
      if (existing.absolutePath !== entry.absolutePath) {
        throw new Error(`Route name "${name}" is already defined.`)
      }
      warnDev(
        `[vue-routing] Route name "${name}" was re-registered for the same path ` +
          `"${entry.absolutePath}" — replacing the previous record ` +
          `(this usually means a routes module was re-evaluated).`,
      )
    }
    this.entries.set(name, entry)
  }

  /** Remove a registered name (used when a route is renamed). */
  public remove(name: string): void {
    this.entries.delete(name)
  }

  public has(name: string): boolean {
    return this.entries.has(name)
  }

  /**
   * Generate a URL for a named route (Laravel's `route()` helper).
   *
   * For a `domain()`-bound route whose domain params can all be resolved from
   * the provided params (or the route's defaults), a protocol-relative
   * absolute URL is returned (`//acme.example.com/dash`) — subdomain params
   * belong in the host, never in the query string. Otherwise the relative
   * path is returned and domain-only params are dropped.
   */
  public url(name: string, params: Record<string, ParamValueInput> = {}): string {
    const entry = this.entries.get(name)
    if (!entry) throw new Error(`Route "${name}" is not defined.`)
    const pathParams = new Set(extractParamNames(entry.absolutePath).map((token) => token.name))
    const allDefaults = entry.record.meta?.defaults ?? {}
    // Per-route defaults fill in omitted PATH params only — a default for a
    // non-path param must not leak into every URL's query string.
    const defaults = Object.entries(allDefaults).filter(([key]) => pathParams.has(key))
    // Params that exist only in the route's domain pattern are consumed by the
    // host, never by the path — drop them so they don't leak into the query.
    const domain = entry.record.meta?.domain
    const domainParams = domain === undefined ? [] : domainParamNames(domain)
    const domainOnly = new Set(domainParams.filter((param) => !pathParams.has(param)))

    const host =
      domain === undefined ? undefined : fillDomain(domain, domainParams, params, allDefaults)

    const provided = Object.entries(params).filter(([key]) => !domainOnly.has(key))
    const path = compileUrl(entry.absolutePath, Object.fromEntries([...defaults, ...provided]))
    return host === undefined ? path : `//${host}${path}`
  }

  public clear(): void {
    this.entries.clear()
  }
}

/**
 * Substitute a domain pattern's `{param}` tokens from the provided params
 * (falling back to the route's defaults). Returns `undefined` when the domain
 * is static or any domain param is missing — the caller then falls back to a
 * relative URL, which keeps zero-argument `route()` calls working.
 */
function fillDomain(
  domain: string,
  domainParams: readonly string[],
  params: Record<string, ParamValueInput>,
  defaults: Record<string, ParamValue>,
): string | undefined {
  if (domainParams.length === 0) return undefined
  const values: Record<string, ParamValue> = {}
  for (const param of domainParams) {
    const value = params[param] ?? defaults[param]
    // A domain token holds exactly one host segment — arrays (the only object
    // shape in ParamValueInput) can't fill it.
    if (value === undefined || value === '' || typeof value === 'object') return undefined
    values[param] = value
  }
  return domain.replace(/\{(\w+)\}/g, (_match, token: string) =>
    encodeURIComponent(String(values[token] ?? '')),
  )
}

/** Warn outside production builds (re-registration is a dev-time event). */
function warnDev(message: string): void {
  const globals = globalThis as { process?: { env?: Record<string, string | undefined> } }
  if (globals.process?.env?.['NODE_ENV'] === 'production') return
  console.warn(message)
}
