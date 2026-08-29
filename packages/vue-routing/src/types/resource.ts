import type { RouteComponent } from '@/types/components'
import type { ResourceAction, SingletonAction } from '@/constants'

/**
 * Options accepted by `resource()` (and, via {@link SingletonOptions},
 * `singleton()`). The action union is a type parameter so `only` / `except` /
 * `components` keys are checked against the real action names  a typo like
 * `only: ['idnex']` fails to compile instead of silently dropping routes.
 */
export interface ResourceOptions<TAction extends string = ResourceAction> {
  /** Restrict to these actions. */
  only?: readonly TAction[]
  /** Exclude these actions. */
  except?: readonly TAction[]
  /** Per-action components, overriding the shared component. */
  components?: Partial<Record<TAction, RouteComponent>>
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
}

/** Options accepted by `singleton()`. */
export interface SingletonOptions extends ResourceOptions<SingletonAction> {
  /** Also register the `create` action (Laravel's `->creatable()`). */
  creatable?: boolean
}
