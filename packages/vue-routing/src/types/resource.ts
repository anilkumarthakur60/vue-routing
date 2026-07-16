import type { RouteComponent } from '@/lib/types/components'

/** Options accepted by `resource()`. */
export interface ResourceOptions {
  /** Restrict to these actions. */
  only?: readonly string[]
  /** Exclude these actions. */
  except?: readonly string[]
  /** Per-action components, overriding the shared component. */
  components?: Partial<Record<string, RouteComponent>>
  /**
   * Override the route parameter name for a resource segment (Laravel's
   * `->parameters([...])`). Keyed by the resource segment, e.g.
   * `{ users: 'admin_user' }` makes the param `{admin_user}` instead of the
   * singularized default `{user}`.
   */
  parameters?: Record<string, string>
  /**
   * Override the route-name prefix (Laravel's `->names('x')`), so a resource
   * named `photos` can produce `images.index`, `images.show`, … instead.
   */
  names?: string
  /**
   * For `singleton()` only: also register the `create` action (Laravel's
   * `->creatable()`). Ignored by `resource()`.
   */
  creatable?: boolean
}
