import type { MiddlewareFn, MissingHandler } from '@/types/navigation'
import type { RouteComponent } from '@/types/components'

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
  /**
   * Custom binding columns (`{param:field}`) declared in group prefixes.
   * Collected before the prefixes are converted to `:param` syntax  the brace
   * form is destroyed by the conversion, so this is the only place the field
   * survives for prefix-declared params.
   */
  bindingFields: Record<string, string>
  /** Layout components from outermost to innermost. */
  layouts: RouteComponent[]
  scopeBindings: boolean
  withoutScopedBindings: boolean
  missing: MissingHandler | undefined
}
