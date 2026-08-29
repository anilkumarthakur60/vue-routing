/**
 * The public facade  Laravel's `Route`. A thin, fully-typed surface over an
 * internal {@link RouterCore}. Attribute/definition methods delegate to a fresh
 * root {@link RouteRegistrar}; router-wide concerns (global patterns, bindings,
 * named-route URLs, inspection) live directly on the facade.
 */
import type { RouteRecordRaw } from 'vue-router'
import { RouterCore, type RouteListRow } from '@/registry'
import { RouteRegistrar } from '@/builder/route-registrar'
import type { RouteDefinition } from '@/builder/route-definition'
import type {
  PendingResourceCollection,
  PendingResourceRegistration,
  PendingSingletonRegistration,
} from '@/builder/pending-resource'
import type {
  BindingResolver,
  GroupAttributes,
  MiddlewareFn,
  MissingHandler,
  ResourceOptions,
  RouteComponent,
  SingletonOptions,
} from '@/types'
import type { ParamValueInput } from '@/path'

export class Router {
  private readonly core = new RouterCore()

  /** A fresh attribute builder seeded with no attributes. */
  private root(): RouteRegistrar {
    return new RouteRegistrar(this.core)
  }

  // ── Attribute builders (return a RouteRegistrar → .group()) ──────────────────

  public middleware(...middlewares: MiddlewareFn[]): RouteRegistrar {
    return this.root().middleware(...middlewares)
  }

  public withoutMiddleware(...middlewares: MiddlewareFn[]): RouteRegistrar {
    return this.root().withoutMiddleware(...middlewares)
  }

  public prefix(prefix: string): RouteRegistrar {
    return this.root().prefix(prefix)
  }

  public name(namePrefix: string): RouteRegistrar {
    return this.root().name(namePrefix)
  }

  public asPrefix(namePrefix: string): RouteRegistrar {
    return this.root().asPrefix(namePrefix)
  }

  public domain(domain: string): RouteRegistrar {
    return this.root().domain(domain)
  }

  public layout(component: RouteComponent): RouteRegistrar {
    return this.root().layout(component)
  }

  public component(component: RouteComponent): RouteRegistrar {
    return this.root().component(component)
  }

  public where(constraints: Record<string, string>): RouteRegistrar {
    return this.root().where(constraints)
  }

  public whereNumber(...params: string[]): RouteRegistrar {
    return this.root().whereNumber(...params)
  }

  public whereAlpha(...params: string[]): RouteRegistrar {
    return this.root().whereAlpha(...params)
  }

  public whereAlphaNumeric(...params: string[]): RouteRegistrar {
    return this.root().whereAlphaNumeric(...params)
  }

  public whereUuid(...params: string[]): RouteRegistrar {
    return this.root().whereUuid(...params)
  }

  public whereUlid(...params: string[]): RouteRegistrar {
    return this.root().whereUlid(...params)
  }

  public whereIn(param: string, values: readonly string[]): RouteRegistrar {
    return this.root().whereIn(param, values)
  }

  public missing(handler: MissingHandler): RouteRegistrar {
    return this.root().missing(handler)
  }

  public scopeBindings(): RouteRegistrar {
    return this.root().scopeBindings()
  }

  public withoutScopedBindings(): RouteRegistrar {
    return this.root().withoutScopedBindings()
  }

  // ── Group opener ───────────────────────────────────────────────────────────────

  public group(callback: () => void): void
  public group(options: GroupAttributes, callback: () => void): void
  public group(optionsOrCallback: GroupAttributes | (() => void), callback?: () => void): void {
    if (typeof optionsOrCallback === 'function') {
      this.root().group(optionsOrCallback)
      return
    }
    if (!callback) throw new Error('A callback is required when passing group options.')
    this.root().group(optionsOrCallback, callback)
  }

  // ── Route definitions ──────────────────────────────────────────────────────────

  public get(uri: string, component: RouteComponent): RouteDefinition {
    return this.root().get(uri, component)
  }

  public view(
    uri: string,
    component: RouteComponent,
    props?: Record<string, unknown>,
  ): RouteDefinition {
    return this.root().view(uri, component, props)
  }

  public redirect(from: string, to: string, status = 302): RouteDefinition {
    return this.root().redirect(from, to, status)
  }

  public permanentRedirect(from: string, to: string): RouteDefinition {
    return this.root().permanentRedirect(from, to)
  }

  public fallback(component: RouteComponent): RouteDefinition {
    return this.root().fallback(component)
  }

  public resource(
    name: string,
    component: RouteComponent,
    options?: ResourceOptions,
  ): PendingResourceRegistration {
    return this.root().resource(name, component, options)
  }

  public resources(
    map: Record<string, RouteComponent>,
    options?: ResourceOptions,
  ): PendingResourceCollection {
    return this.root().resources(map, options)
  }

  public singleton(
    name: string,
    component: RouteComponent,
    options?: SingletonOptions,
  ): PendingSingletonRegistration {
    return this.root().singleton(name, component, options)
  }

  // ── Global parameter patterns ────────────────────────────────────────────────

  /**
   * Define a global constraint applied to every matching parameter name.
   * Applied lazily at `getRoutes()`/`toList()` time, so the pattern also
   * constrains routes that were registered before it was defined.
   */
  public pattern(param: string, regex: string): this {
    this.core.addPatterns({ [param]: regex })
    return this
  }

  /** Define multiple global constraints at once. */
  public patterns(map: Record<string, string>): this {
    this.core.addPatterns(map)
    return this
  }

  // ── Explicit model bindings ───────────────────────────────────────────────────

  /** Register an explicit binding resolver for a route parameter. */
  public bind<TModel>(param: string, resolver: BindingResolver<TModel>): this {
    this.core.bind(param, resolver)
    return this
  }

  /** Alias of {@link bind} (Laravel's `Route::model`). */
  public model<TModel>(param: string, resolver: BindingResolver<TModel>): this {
    return this.bind(param, resolver)
  }

  /**
   * The registered bindings, to pass into {@link createAppRouter}. Returns a
   * snapshot copy  mutating it cannot corrupt the registry (and `flush()`
   * cannot empty a map a consumer already holds).
   */
  public getBindings(): Map<string, BindingResolver> {
    return new Map(this.core.bindings)
  }

  // ── Inspection / export ──────────────────────────────────────────────────────

  /** Whether a named route exists. */
  public has(name: string): boolean {
    return this.core.hasName(name)
  }

  /** Generate a URL for a named route, Laravel `route()`-style. */
  public route(name: string, params?: Record<string, ParamValueInput>): string {
    return this.core.url(name, params)
  }

  /** The accumulated route records, for `createAppRouter()`. */
  public getRoutes(): RouteRecordRaw[] {
    return this.core.getRoutes()
  }

  /** Structured list of registered routes (for debugging). */
  public toList(filterPath?: string): RouteListRow[] {
    return this.core.describe(filterPath)
  }

  /** Print the route table to the console. */
  public list(options: { path?: string } = {}): void {
    console.table(this.core.describe(options.path))
  }

  /** Reset all router state (primarily for tests). */
  public flush(): this {
    this.core.flush()
    return this
  }
}

/**
 * Create an isolated `Route` facade with its own registry state.
 *
 * Prefer this over the shared {@link Route} singleton whenever the module
 * graph can be evaluated more than once against a cached copy of this library
 * (Vite SSR dev, HMR boundaries, per-request SSR, cross-file tests)  build
 * your routes inside an explicit function and call it per router creation.
 *
 * @example
 * ```ts
 * export function defineRoutes(Route = createRouteFacade()) {
 *   Route.get('/', Home).name('home')
 *   return Route
 * }
 * ```
 */
export function createRouteFacade(): Router {
  return new Router()
}

/** The singleton facade  import and use like Laravel's `Route`. */
export const Route: Router = /* @__PURE__ */ new Router()
