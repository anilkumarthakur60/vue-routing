import type { RouteRecordRaw } from 'vue-router'
import type { NamedRouteEntry } from '@/lib/types/factory'

/**
 * The result of registering a route in the {@link RouterCore}: the underlying
 * vue-router record plus the metadata a {@link RouteDefinition} needs to expose
 * its fluent chain. This is the seam that decouples the registry from the
 * fluent builder (the registry never imports the builder).
 */
export interface RegisteredRoute {
  record: RouteRecordRaw
  /** Absolute `:param` path (no regex) for named-route URL generation. */
  absolutePath: string
  /** Name prefix inherited from the enclosing group(s). */
  namePrefix: string
}

/** The capabilities a {@link RouteDefinition} needs from the registry. */
export interface RouteDefinitionHost {
  registerName(name: string, entry: NamedRouteEntry): void
  readonly globalPatterns: Record<string, string>
}
