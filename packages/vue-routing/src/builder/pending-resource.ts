/**
 * Deferred resource registration  the analogue of Laravel's
 * `PendingResourceRegistration`.
 *
 * `resource()` / `singleton()` no longer register their routes eagerly.
 * Instead they enqueue a pending registration on the {@link RouterCore} and
 * return one of these builders, whose fluent methods actually apply  so the
 * idiomatic Laravel chain `Route.resource('users', C).middleware(auth)` works
 * instead of silently doing nothing. Pending registrations are committed
 * (in declaration order, inside the group context where they were declared)
 * before any new route registration or router query.
 */
import type { RouteRegistrar } from '@/builder/route-registrar'
import type { MiddlewareFn, MissingHandler, ResourceOptions, SingletonOptions } from '@/types'
import type { ResourceAction, SingletonAction } from '@/constants'

export class PendingResourceRegistration<
  TAction extends string = ResourceAction,
  TOptions extends ResourceOptions<TAction> = ResourceOptions<TAction>,
> {
  private base: RouteRegistrar
  protected readonly options: TOptions
  private readonly registerRoutes: (registrar: RouteRegistrar, options: TOptions) => void
  private committed = false

  constructor(
    base: RouteRegistrar,
    options: TOptions,
    registerRoutes: (registrar: RouteRegistrar, options: TOptions) => void,
  ) {
    this.base = base
    this.options = { ...options }
    this.registerRoutes = registerRoutes
  }

  // ── Option modifiers (Laravel's ->only()/->except()/->names()/->parameters()) ──

  /** Restrict to these actions. */
  public only(...actions: TAction[]): this {
    this.assertPending()
    this.options.only = actions
    return this
  }

  /** Exclude these actions. */
  public except(...actions: TAction[]): this {
    this.assertPending()
    this.options.except = actions
    return this
  }

  /** Override the route-name prefix (Laravel's `->names('x')`). */
  public names(nameBase: string): this {
    this.assertPending()
    this.options.names = nameBase
    return this
  }

  /** Override the route parameter names per resource segment. */
  public parameters(map: Record<string, string>): this {
    this.assertPending()
    this.options.parameters = { ...this.options.parameters, ...map }
    return this
  }

  /** Override a single segment's route parameter name. */
  public parameter(segment: string, param: string): this {
    return this.parameters({ [segment]: param })
  }

  // ── Attribute modifiers (delegate to the underlying registrar chain) ─────────

  /** Add middleware to every route of the resource. */
  public middleware(...middlewares: MiddlewareFn[]): this {
    this.assertPending()
    this.base = this.base.middleware(...middlewares)
    return this
  }

  /** Exclude inherited middleware from every route of the resource. */
  public withoutMiddleware(...middlewares: MiddlewareFn[]): this {
    this.assertPending()
    this.base = this.base.withoutMiddleware(...middlewares)
    return this
  }

  /** Apply regex constraints to the resource's parameters. */
  public where(constraints: Record<string, string>): this {
    this.assertPending()
    this.base = this.base.where(constraints)
    return this
  }

  /** Constrain parameters to integers. */
  public whereNumber(...params: string[]): this {
    this.assertPending()
    this.base = this.base.whereNumber(...params)
    return this
  }

  /** Constrain parameters to alphabetic characters. */
  public whereAlpha(...params: string[]): this {
    this.assertPending()
    this.base = this.base.whereAlpha(...params)
    return this
  }

  /** Constrain parameters to alphanumeric characters. */
  public whereAlphaNumeric(...params: string[]): this {
    this.assertPending()
    this.base = this.base.whereAlphaNumeric(...params)
    return this
  }

  /** Constrain parameters to a UUID. */
  public whereUuid(...params: string[]): this {
    this.assertPending()
    this.base = this.base.whereUuid(...params)
    return this
  }

  /** Constrain parameters to a ULID. */
  public whereUlid(...params: string[]): this {
    this.assertPending()
    this.base = this.base.whereUlid(...params)
    return this
  }

  /** Constrain a parameter to one of a fixed set of values. */
  public whereIn(param: string, values: readonly string[]): this {
    this.assertPending()
    this.base = this.base.whereIn(param, values)
    return this
  }

  /** Provide a missing-model handler for the resource's routes. */
  public missing(handler: MissingHandler): this {
    this.assertPending()
    this.base = this.base.missing(handler)
    return this
  }

  /** Scope nested child bindings to their parent. */
  public scopeBindings(): this {
    this.assertPending()
    this.base = this.base.scopeBindings()
    return this
  }

  /** Explicitly disable scoped child bindings. */
  public withoutScopedBindings(): this {
    this.assertPending()
    this.base = this.base.withoutScopedBindings()
    return this
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  /** @internal Called by the registry when the pending registration flushes. */
  public commit(): void {
    if (this.committed) return
    this.committed = true
    this.registerRoutes(this.base, this.options)
  }

  private assertPending(): void {
    if (this.committed) {
      throw new Error(
        'This resource registration has already been committed  chain its ' +
          'options immediately after resource()/singleton(), before registering ' +
          'other routes or querying the router.',
      )
    }
  }
}

/** Deferred `singleton()` registration  adds the `creatable()` modifier. */
export class PendingSingletonRegistration extends PendingResourceRegistration<
  SingletonAction,
  SingletonOptions
> {
  /** Also register the `create` action (Laravel's `->creatable()`). */
  public creatable(creatable = true): this {
    this.options.creatable = creatable
    return this
  }
}

/** Fluent fan-out over the pendings created by `resources()`. */
export class PendingResourceCollection {
  private readonly pendings: readonly PendingResourceRegistration[]

  constructor(pendings: readonly PendingResourceRegistration[]) {
    this.pendings = pendings
  }

  private each(apply: (pending: PendingResourceRegistration) => void): this {
    for (const pending of this.pendings) apply(pending)
    return this
  }

  /** Restrict every resource to these actions. */
  public only(...actions: ResourceAction[]): this {
    return this.each((pending) => pending.only(...actions))
  }

  /** Exclude these actions from every resource. */
  public except(...actions: ResourceAction[]): this {
    return this.each((pending) => pending.except(...actions))
  }

  /** Override route parameter names across every resource. */
  public parameters(map: Record<string, string>): this {
    return this.each((pending) => pending.parameters(map))
  }

  /** Add middleware to every route of every resource. */
  public middleware(...middlewares: MiddlewareFn[]): this {
    return this.each((pending) => pending.middleware(...middlewares))
  }

  /** Exclude inherited middleware from every resource. */
  public withoutMiddleware(...middlewares: MiddlewareFn[]): this {
    return this.each((pending) => pending.withoutMiddleware(...middlewares))
  }

  /** Apply regex constraints across every resource. */
  public where(constraints: Record<string, string>): this {
    return this.each((pending) => pending.where(constraints))
  }

  /** Provide a missing-model handler across every resource. */
  public missing(handler: MissingHandler): this {
    return this.each((pending) => pending.missing(handler))
  }
}
