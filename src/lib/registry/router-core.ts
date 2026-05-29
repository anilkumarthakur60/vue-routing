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
} from '@/lib/types'
import type { ParamValue } from '@/lib/path'
import { GroupStack } from '@/lib/registry/group-stack'
import { RouteTree, type RouteListRow } from '@/lib/registry/route-tree'
import { NameRegistry } from '@/lib/registry/name-registry'
import { BindingRegistry } from '@/lib/registry/binding-registry'
import {
  buildFallbackRecord,
  buildRedirectRecord,
  buildRouteRecord,
  type BuiltRecord,
} from '@/lib/registry/record-factory'

export class RouterCore implements RouteDefinitionHost {
  private readonly groups = new GroupStack()
  private readonly tree = new RouteTree()
  private readonly names = new NameRegistry()
  private readonly bindingRegistry = new BindingRegistry()

  public readonly globalPatterns: Record<string, string> = {}

  // ── Group stack ───────────────────────────────────────────────────────────

  public runGroup(attributes: GroupAttributes, callback: () => void): void {
    this.groups.run(attributes, callback)
  }

  // ── Registration ──────────────────────────────────────────────────────────

  public registerRoute(
    transient: GroupAttributes,
    uri: string,
    component: RouteComponent,
    action?: string,
  ): RegisteredRoute {
    const context = this.groups.resolve(transient)
    const built = buildRouteRecord(context, uri, component, this.globalPatterns, action)
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
      // Replace the default `props: true` with a static props factory.
      ;(registered.record as { props?: unknown }).props = () => props
    }
    return registered
  }

  public registerRedirect(
    transient: GroupAttributes,
    from: string,
    to: string,
    status: number,
  ): RegisteredRoute {
    const context = this.groups.resolve(transient)
    const built = buildRedirectRecord(context, from, to, status)
    return this.place(built, context.namePrefix, context.layouts)
  }

  public registerFallback(transient: GroupAttributes, component: RouteComponent): RegisteredRoute {
    const context = this.groups.resolve(transient)
    const built = buildFallbackRecord(context, component)
    const registered = this.place(built, context.namePrefix, context.layouts)
    this.names.register('NotFound', { record: built.record, absolutePath: built.absolutePath })
    return registered
  }

  // ── RouteDefinitionHost ─────────────────────────────────────────────────────

  public registerName(name: string, entry: NamedRouteEntry): void {
    this.names.register(name, entry)
  }

  // ── Bindings ────────────────────────────────────────────────────────────────

  public bind(param: string, resolver: BindingResolver): void {
    this.bindingRegistry.set(param, resolver)
  }

  public get bindings(): Map<string, BindingResolver> {
    return this.bindingRegistry.all()
  }

  // ── Queries / export ─────────────────────────────────────────────────────────

  public hasName(name: string): boolean {
    return this.names.has(name)
  }

  public url(name: string, params?: Record<string, ParamValue>): string {
    return this.names.url(name, params)
  }

  public getRoutes(): RouteRecordRaw[] {
    return this.tree.roots()
  }

  public describe(filterPath?: string): RouteListRow[] {
    return this.tree.describe(filterPath)
  }

  public flush(): void {
    this.groups.clear()
    this.tree.clear()
    this.names.clear()
    this.bindingRegistry.clear()
    for (const key of Object.keys(this.globalPatterns)) delete this.globalPatterns[key]
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
}
