import type { MiddlewareFn, MissingHandler } from '@/lib/types/navigation'

/** Strongly-typed metadata attached to every route record this package creates. */
export interface AppRouteMeta {
  /** Middleware to run, in order, before entering the route. */
  middleware?: MiddlewareFn[]
  /** Middleware explicitly removed via `withoutMiddleware()`. */
  excludedMiddleware?: MiddlewareFn[]
  /** Regex constraints applied to route parameters. */
  where?: Record<string, string>
  /** Whether child bindings should be scoped to their parent. */
  scopeBindings?: boolean
  /** Whether scoped child bindings are explicitly disabled. */
  withoutScopedBindings?: boolean
  /** Whether soft-deleted models should be resolvable for this route. */
  withTrashed?: boolean
  /** Handler invoked when a bound model is missing. */
  missing?: MissingHandler
  /** The resourceful action name (`index`, `show`, …) when applicable. */
  action?: string
  /** Subdomain pattern (e.g. `{account}.example.com`). */
  domain?: string
  /** HTTP status for redirect routes. */
  redirectStatus?: number
  /** Marks a redirect route. */
  isRedirect?: boolean
  /** Marks a `view()` route. */
  isView?: boolean
  /** Marks the fallback (404) route. */
  isFallback?: boolean
  /** Models resolved by explicit bindings for the current navigation. */
  bound?: Record<string, unknown>
}

declare module 'vue-router' {
  // Merge our fields into vue-router's RouteMeta so `to.meta.middleware` etc.
  // are typed without casts anywhere in this package or in consumer apps.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta extends AppRouteMeta {}
}
