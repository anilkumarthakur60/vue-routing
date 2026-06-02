import type { MiddlewareFn, MissingHandler } from '@/lib/types/navigation'
import type { RouteComponent } from '@/lib/types/components'

/** Raw attributes accumulated by a single group level before merging. */
export interface GroupAttributes {
  prefix?: string
  namePrefix?: string
  middleware?: MiddlewareFn[]
  /** Middleware removed from the group (Laravel's group `withoutMiddleware`). */
  excludedMiddleware?: MiddlewareFn[]
  where?: Record<string, string>
  domain?: string
  layout?: RouteComponent
  scopeBindings?: boolean
  withoutScopedBindings?: boolean
  missing?: MissingHandler
}

/** Fully-resolved context after merging the group stack + transient attributes. */
export interface ResolvedContext {
  prefix: string
  namePrefix: string
  middleware: MiddlewareFn[]
  /** Middleware removed via `withoutMiddleware()` across the group stack. */
  excludedMiddleware: MiddlewareFn[]
  where: Record<string, string>
  domain: string | undefined
  /** Layout components from outermost to innermost. */
  layouts: RouteComponent[]
  scopeBindings: boolean
  withoutScopedBindings: boolean
  missing: MissingHandler | undefined
}
