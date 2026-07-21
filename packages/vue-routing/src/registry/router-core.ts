/**
 * The registry's composition root. Wires together the focused collaborators
 * (group stack, route tree, name registry, binding registry, global patterns)
 * and exposes route-registration methods.
 *
 * Crucially, it returns plain {@link RegisteredRoute} values — it does NOT know
 * about the fluent {@link RouteDefinition}. That keeps the registry layer free
 * of any dependency on the builder layer.
 */
import type { RouteRecordRaw } from 'vue-router'
import type {
  BindingResolver,
  GroupAttributes,
  NamedRouteEntry,
  RegisteredRoute,
  RouteComponent,
  RouteDefinitionHost,
} from '@/types'
import type { ResourceAction } from '@/constants'
import { applyWhereConstraints, type ParamValueInput } from '@/path'
import { appendRouteName } from '@/text'
import { GroupStack } from '@/registry/group-stack'
import { RouteTree, type RouteListRow } from '@/registry/route-tree'
import { NameRegistry } from '@/registry/name-registry'
import { BindingRegistry } from '@/registry/binding-registry'
import {
  buildFallbackRecord,
  buildRedirectRecord,
  buildRouteRecord,
  type BuiltRecord,
} from '@/registry/record-factory'

export class RouterCore implements RouteDefinitionHost {
  private readonly groups = new GroupStack()
  private readonly tree = new RouteTree()
  private readonly names = new NameRegistry()
  private readonly bindingRegistry = new BindingRegistry()

  /** Deferred registrations (pending resources), flushed before any query. */
  private readonly pendingRegistrations: (() => void)[] = []
  private flushingPending = false

  /** Private backing for {@link globalPatterns}; reassigned by `flush()`. */
  private patternStore: Record<string, string> = {}

  /** Read-only view of the global parameter patterns. */
  public get globalPatterns(): Readonly<Record<string, string>> {
    return this.patternStore
  }

  /** Register global parameter patterns (Laravel's `Route::pattern`). */
  public addPatterns(map: Record<string, string>): void {
    Object.assign(this.patternStore, map)
  }

  // ── Group stack ───────────────────────────────────────────────────────────

  public runGroup(attributes: GroupAttributes, callback: () => void): void {
    this.groups.run(attributes, callback)
  }

  // ── Deferred registration (pending resources) ─────────────────────────────

  /**
   * Queue a deferred registration. The current group stack is captured so the
   * callback runs in the context where it was declared, no matter when it
   * flushes.
   */
  public enqueue(register: () => void): void {
    const snapshot = this.groups.snapshot()
    this.pendingRegistrations.push(() => {
      this.groups.runScoped(snapshot, register)
    })
  }

  /** Commit queued registrations, preserving declaration order. */
  private flushPendingRegistrations(): void {
    if (this.flushingPending) return
    this.flushingPending = true
    try {
      while (this.pendingRegistrations.length > 0) {
        this.pendingRegistrations.shift()?.()
      }
    } finally {
      this.flushingPending = false
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────

  public registerRoute(
    transient: GroupAttributes,
    uri: string,
    component: RouteComponent,
    action?: ResourceAction,
  ): RegisteredRoute {
    this.flushPendingRegistrations()
    const context = this.groups.resolve(transient)
    // Global patterns are applied lazily (see getRoutes/describe) so patterns
    // declared after a route still constrain it — only `where` bakes here.
    const built = buildRouteRecord(context, uri, component, {}, action)
    return this.place(built, context.namePrefix, context.layouts)
  }

  public registerView(
    transient: GroupAttributes,
    uri: string,
    component: RouteComponent,
    props?: Record<string, unknown>,
  ): RegisteredRoute {
    const registered = this.registerRoute(transient, uri, component)
    registered.record.meta = { ...registered.record.meta, isView: true }
    if (props) {
      // Merge route params with the static props (static wins on conflict) —
      // passing static props must not silently stop `{param}` segments from
      // reaching the component as props.
      ;(registered.record as { props?: unknown }).props = (route: {
        params: Record<string, unknown>
      }) => ({ ...route.params, ...props })
    }
    return registered
  }

  public registerRedirect(
    transient: GroupAttributes,
    from: string,
    to: string,
    status: number,
  ): RegisteredRoute {
    this.flushPendingRegistrations()
    const context = this.groups.resolve(transient)
    const built = buildRedirectRecord(context, from, to, status)
    return this.place(built, context.namePrefix, context.layouts)
  }

  public registerFallback(transient: GroupAttributes, component: RouteComponent): RegisteredRoute {
    this.flushPendingRegistrations()
    const context = this.groups.resolve(transient)
    // Scope the auto-name to the group's name prefix so prefixed fallbacks can
    // coexist with the global one ('admin.NotFound' vs 'NotFound').
    const name = appendRouteName(context.namePrefix, 'NotFound')
    const built = buildFallbackRecord(context, component, name)
    const registered = this.place(built, context.namePrefix, context.layouts)
    this.names.register(name, { record: built.record, absolutePath: built.absolutePath })
    return registered
  }

  // ── RouteDefinitionHost ─────────────────────────────────────────────────────

  public registerName(name: string, entry: NamedRouteEntry): void {
    this.names.register(name, entry)
  }

  public unregisterName(name: string): void {
    this.names.remove(name)
  }

  // ── Bindings ────────────────────────────────────────────────────────────────

  public bind(param: string, resolver: BindingResolver): void {
    this.bindingRegistry.set(param, resolver)
  }

  public get bindings(): ReadonlyMap<string, BindingResolver> {
    return this.bindingRegistry.all()
  }

  // ── Queries / export ─────────────────────────────────────────────────────────

  public hasName(name: string): boolean {
    this.flushPendingRegistrations()
    return this.names.has(name)
  }

  public url(name: string, params?: Record<string, ParamValueInput>): string {
    this.flushPendingRegistrations()
    return this.names.url(name, params)
  }

  public getRoutes(): RouteRecordRaw[] {
    this.flushPendingRegistrations()
    this.applyGlobalPatterns()
    return this.tree.roots()
  }

  public describe(filterPath?: string): RouteListRow[] {
    this.flushPendingRegistrations()
    this.applyGlobalPatterns()
    return this.tree.describe(filterPath)
  }

  public flush(): void {
    this.groups.clear()
    this.tree.clear()
    this.names.clear()
    this.bindingRegistry.clear()
    this.pendingRegistrations.length = 0
    this.patternStore = {}
  }

  // ── Internals ─────────────────────────────────────────────────────────────────

  private place(
    built: BuiltRecord,
    namePrefix: string,
    layouts: RouteComponent[],
  ): RegisteredRoute {
    this.tree.add(built.record, layouts)
    return { record: built.record, absolutePath: built.absolutePath, namePrefix }
  }

  /**
   * Bake the global patterns into every record path that does not already
   * carry an inline constraint. Running this at export time (instead of at
   * registration) makes `Route.pattern()` order-independent: patterns defined
   * after the routes still apply. Explicit `where()` constraints stay baked
   * into the path, so they always win over a global pattern.
   */
  private applyGlobalPatterns(): void {
    if (Object.keys(this.patternStore).length === 0) return
    const apply = (records: readonly RouteRecordRaw[]): void => {
      for (const record of records) {
        record.path = applyWhereConstraints(record.path, {}, this.patternStore)
        const children = (record as { children?: RouteRecordRaw[] }).children
        if (children) apply(children)
      }
    }
    apply(this.tree.roots())
  }
}
