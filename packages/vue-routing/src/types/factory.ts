import type { RouteRecordRaw, Router } from 'vue-router'
import type { BindingResolver } from '@/types/navigation'

/** History mode for the created router. */
export type HistoryMode = 'history' | 'hash' | 'memory'

/** Options for `createAppRouter()`. */
export interface CreateAppRouterOptions {
  /** Route records, typically from `Route.getRoutes()`. */
  routes: RouteRecordRaw[]
  /** History mode — defaults to `'history'`. */
  historyMode?: HistoryMode
  /** Base URL for history (e.g. `import.meta.env.BASE_URL`). */
  base?: string
  /**
   * Custom scroll behavior. Defaults to restoring the saved position on
   * back/forward navigation, otherwise scrolling to top-left.
   */
  scrollBehavior?: Router['options']['scrollBehavior']
  /** Explicit model bindings to resolve during navigation. */
  bindings?: Map<string, BindingResolver>
  /**
   * The hostname used to resolve `domain()`-restricted routes. Records whose
   * domain pattern does not match are dropped at router-creation time, so the
   * same path may be registered under several domains and each host sees only
   * its own record.
   *
   * Precedence: this option → `window.location.hostname` → no domain
   * filtering or validation at all (SSR without a hostname). SSR consumers
   * should pass the incoming request's `Host` header here.
   */
  hostname?: string
}

/** A single named-route entry, retaining the absolute path for URL generation. */
export interface NamedRouteEntry {
  record: RouteRecordRaw
  /** Absolute path with `:param` placeholders, no regex constraints. */
  absolutePath: string
}
