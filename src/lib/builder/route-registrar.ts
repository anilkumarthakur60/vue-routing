/**
 * Fluent group/attribute builder — the analogue of Laravel's `RouteRegistrar`.
 *
 * Attribute methods return a NEW immutable registrar carrying the merged
 * attributes. Terminal methods either open a `group()` or register a route via
 * the {@link RouterCore} and wrap the result in a {@link RouteDefinition}.
 *
 * Client-side router → the only verb is `get` (navigation).
 */
import { RESOURCE_ACTIONS, RESOURCE_ACTION_MAP, type PatternName } from '@/lib/constants'
import type { RouterCore } from '@/lib/registry'
import type {
  GroupAttributes,
  MiddlewareFn,
  MissingHandler,
  RegisteredRoute,
  ResourceOptions,
  RouteComponent,
} from '@/lib/types'
import { appendRouteName } from '@/lib/text'
import { joinPaths, patternConstraints } from '@/lib/path'
import { RouteDefinition } from '@/lib/builder/route-definition'

export class RouteRegistrar {
  private readonly core: RouterCore
  private readonly attributes: GroupAttributes

  constructor(core: RouterCore, attributes: GroupAttributes = {}) {
    this.core = core
    this.attributes = attributes
  }

  private with(patch: Partial<GroupAttributes>): RouteRegistrar {
    return new RouteRegistrar(this.core, { ...this.attributes, ...patch })
  }

  private define(registered: RegisteredRoute): RouteDefinition {
    return new RouteDefinition(registered, this.core)
  }

  // ── Attribute builders ──────────────────────────────────────────────────────

  /** Add middleware shared by the group / next route. */
  public middleware(...middlewares: MiddlewareFn[]): RouteRegistrar {
    return this.with({ middleware: [...(this.attributes.middleware ?? []), ...middlewares] })
  }

  /** Exclude inherited middleware from the group (Laravel's `withoutMiddleware`). */
  public withoutMiddleware(...middlewares: MiddlewareFn[]): RouteRegistrar {
    return this.with({
      excludedMiddleware: [...(this.attributes.excludedMiddleware ?? []), ...middlewares],
    })
  }

  /** Prefix the URI of every route in the group. */
  public prefix(prefix: string): RouteRegistrar {
    return this.with({ prefix })
  }

  /** Prefix the name of every route in the group (Laravel's `name()`). */
  public name(namePrefix: string): RouteRegistrar {
    return this.with({ namePrefix: appendRouteName(this.attributes.namePrefix ?? '', namePrefix) })
  }

  /** Alias of {@link name}, kept for backwards compatibility. */
  public asPrefix(namePrefix: string): RouteRegistrar {
    return this.name(namePrefix)
  }

  /** Constrain the subdomain for the group (e.g. `{account}.example.com`). */
  public domain(domain: string): RouteRegistrar {
    return this.with({ domain })
  }

  /** Wrap the group's routes in a layout component. */
  public layout(component: RouteComponent): RouteRegistrar {
    return this.with({ layout: component })
  }

  /** Alias of {@link layout}. */
  public component(component: RouteComponent): RouteRegistrar {
    return this.layout(component)
  }

  /** Apply regex constraints to parameters across the group. */
  public where(constraints: Record<string, string>): RouteRegistrar {
    return this.with({ where: { ...(this.attributes.where ?? {}), ...constraints } })
  }

  /** Constrain parameters to integers across the group. */
  public whereNumber(...params: string[]): RouteRegistrar {
    return this.wherePattern(params, 'number')
  }

  /** Constrain parameters to alphabetic characters across the group. */
  public whereAlpha(...params: string[]): RouteRegistrar {
    return this.wherePattern(params, 'alpha')
  }

  /** Constrain parameters to alphanumeric characters across the group. */
  public whereAlphaNumeric(...params: string[]): RouteRegistrar {
    return this.wherePattern(params, 'alphaNumeric')
  }

  /** Constrain parameters to a UUID across the group. */
  public whereUuid(...params: string[]): RouteRegistrar {
    return this.wherePattern(params, 'uuid')
  }

  /** Constrain parameters to a ULID across the group. */
  public whereUlid(...params: string[]): RouteRegistrar {
    return this.wherePattern(params, 'ulid')
  }

  /** Constrain a parameter to one of a fixed set of values across the group. */
  public whereIn(param: string, values: readonly string[]): RouteRegistrar {
    return this.where({ [param]: values.join('|') })
  }

  /** Scope nested child bindings to their parent across the group. */
  public scopeBindings(): RouteRegistrar {
    return this.with({ scopeBindings: true })
  }

  /** Disable scoped child bindings across the group. */
  public withoutScopedBindings(): RouteRegistrar {
    return this.with({ withoutScopedBindings: true })
  }

  /** Provide a shared missing-model handler for the group. */
  public missing(handler: MissingHandler): RouteRegistrar {
    return this.with({ missing: handler })
  }

  // ── Group opener ──────────────────────────────────────────────────────────────

  public group(callback: () => void): void
  public group(options: GroupAttributes, callback: () => void): void
  public group(optionsOrCallback: GroupAttributes | (() => void), callback?: () => void): void {
    if (typeof optionsOrCallback === 'function') {
      this.core.runGroup(this.attributes, optionsOrCallback)
      return
    }
    if (!callback) throw new Error('A callback is required when passing group options.')
    this.core.runGroup({ ...this.attributes, ...optionsOrCallback }, callback)
  }

  // ── Route definitions ──────────────────────────────────────────────────────────

  /** Register a navigable (GET) route. */
  public get(uri: string, component: RouteComponent): RouteDefinition {
    return this.define(this.core.registerRoute(this.attributes, uri, component))
  }

  /** Register a view-only route with optional static props. */
  public view(
    uri: string,
    component: RouteComponent,
    props?: Record<string, unknown>,
  ): RouteDefinition {
    return this.define(this.core.registerView(this.attributes, uri, component, props))
  }

  /** Register a redirect (302 by default). */
  public redirect(from: string, to: string, status = 302): RouteDefinition {
    return this.define(this.core.registerRedirect(this.attributes, from, to, status))
  }

  /** Register a permanent (301) redirect. */
  public permanentRedirect(from: string, to: string): RouteDefinition {
    return this.define(this.core.registerRedirect(this.attributes, from, to, 301))
  }

  /** Register the fallback (404) route. */
  public fallback(component: RouteComponent): RouteDefinition {
    return this.define(this.core.registerFallback(this.attributes, component))
  }

  // ── Resourceful routing (navigable pages only) ──────────────────────────────

  /** Register the navigable resource routes (index/create/show/edit). */
  public resource(name: string, component: RouteComponent, options: ResourceOptions = {}): this {
    const actions = filterActions(RESOURCE_ACTIONS, options)
    // Merge the resource name onto any prefix/name already set at this level
    // (e.g. `Route.prefix('admin').resource('posts', …)` → `/admin/posts`)
    // instead of overwriting it.
    const prefix = this.attributes.prefix ? joinPaths(this.attributes.prefix, name) : name
    const namePrefix = appendRouteName(this.attributes.namePrefix ?? '', name)
    this.with({ prefix, namePrefix }).group(() => {
      for (const action of actions) {
        const config = RESOURCE_ACTION_MAP[action]
        const actionComponent = options.components?.[action] ?? component
        this.define(this.core.registerRoute({}, config.uri, actionComponent, action)).name(action)
      }
    })
    return this
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private wherePattern(params: string[], pattern: PatternName): RouteRegistrar {
    return this.where(patternConstraints(params, pattern))
  }
}

function filterActions<T extends string>(all: readonly T[], options: ResourceOptions): T[] {
  if (options.only) return all.filter((action) => options.only?.includes(action))
  if (options.except) return all.filter((action) => !options.except?.includes(action))
  return [...all]
}
