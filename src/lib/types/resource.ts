import type { RouteComponent } from '@/lib/types/components'

/** Options accepted by `resource()`. */
export interface ResourceOptions {
  /** Restrict to these actions. */
  only?: readonly string[]
  /** Exclude these actions. */
  except?: readonly string[]
  /** Per-action components, overriding the shared component. */
  components?: Partial<Record<string, RouteComponent>>
}
