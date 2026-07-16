import type { RouteRecordRaw, Router } from 'vue-router'
import type { BindingResolver } from '@/lib/types/navigation'

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
  /** Custom scroll behavior. Defaults to top-left on navigation. */
  scrollBehavior?: Router['options']['scrollBehavior']
  /** Explicit model bindings to resolve during navigation. */
  bindings?: Map<string, BindingResolver>
}

/** A single named-route entry, retaining the absolute path for URL generation. */
export interface NamedRouteEntry {
  record: RouteRecordRaw
  /** Absolute path with `:param` placeholders, no regex constraints. */
  absolutePath: string
}
