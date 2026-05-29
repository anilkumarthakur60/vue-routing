/**
 * A single registered route, exposing Laravel's per-route fluent chain
 * (`->name()`, `->middleware()`, `->where()`, `->missing()`, …).
 *
 * Wraps a {@link RegisteredRoute} produced by the registry and mutates its
 * underlying record in place. It depends only on the {@link RouteDefinitionHost}
 * contract, never on the concrete registry.
 */
import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import type {
  MiddlewareFn,
  MissingHandler,
  RegisteredRoute,
  RouteDefinitionHost,
} from '@/lib/types'
import { patterns, type PatternName } from '@/lib/constants'
import { applyWhereConstraints } from '@/lib/path'
import { appendRouteName } from '@/lib/text'

export class RouteDefinition {
  /** The underlying vue-router record this definition wraps. */
  public readonly record: RouteRecordRaw
  private readonly absolutePath: string
  private readonly namePrefix: string
  private readonly host: RouteDefinitionHost

  constructor(registered: RegisteredRoute, host: RouteDefinitionHost) {
    this.record = registered.record
    this.absolutePath = registered.absolutePath
    this.namePrefix = registered.namePrefix
    this.host = host
  }

  /** Lazily-initialized, always-present meta object for this record. */
  private get meta(): RouteMeta {
    return (this.record.meta ??= {})
  }

  // ── Naming ──────────────────────────────────────────────────────────────────

  /** Assign a name, prefixed by any enclosing group name. Names must be unique. */
  public name(value: string): this {
    const fullName = appendRouteName(this.namePrefix, value)
    this.record.name = fullName
    this.host.registerName(fullName, { record: this.record, absolutePath: this.absolutePath })
    return this
  }

  /** Alias for {@link name}. */
  public as(value: string): this {
    return this.name(value)
  }

  // ── Middleware ────────────────────────────────────────────────────────────────

  /** Append middleware to run before entering this route. */
  public middleware(...middlewares: MiddlewareFn[]): this {
    this.meta.middleware = [...(this.meta.middleware ?? []), ...middlewares]
    return this
  }

  /** Exclude middleware (e.g. inherited from a group) from this route. */
  public withoutMiddleware(...middlewares: MiddlewareFn[]): this {
    const removed = new Set(middlewares)
    this.meta.excludedMiddleware = [...(this.meta.excludedMiddleware ?? []), ...middlewares]
    this.meta.middleware = (this.meta.middleware ?? []).filter((mw) => !removed.has(mw))
    return this
  }

  // ── Parameter constraints ───────────────────────────────────────────────────

  /** Constrain route parameters with raw regular expressions. */
  public where(constraints: Record<string, string>): this {
    this.record.path = applyWhereConstraints(
      this.record.path,
      constraints,
      this.host.globalPatterns,
    )
    this.meta.where = { ...(this.meta.where ?? {}), ...constraints }
    return this
  }

  /** Constrain the given parameters to integers. */
  public whereNumber(...params: string[]): this {
    return this.applyPattern(params, 'number')
  }

  /** Constrain the given parameters to alphabetic characters. */
  public whereAlpha(...params: string[]): this {
    return this.applyPattern(params, 'alpha')
  }

  /** Constrain the given parameters to alphanumeric characters. */
  public whereAlphaNumeric(...params: string[]): this {
    return this.applyPattern(params, 'alphaNumeric')
  }

  /** Constrain the given parameters to a UUID. */
  public whereUuid(...params: string[]): this {
    return this.applyPattern(params, 'uuid')
  }

  /** Constrain the given parameters to a ULID. */
  public whereUlid(...params: string[]): this {
    return this.applyPattern(params, 'ulid')
  }

  /** Constrain a parameter to one of a fixed set of values. */
  public whereIn(param: string, values: readonly string[]): this {
    return this.where({ [param]: values.join('|') })
  }

  // ── Model binding modifiers ────────────────────────────────────────────────

  /** Provide a handler for when a bound model cannot be resolved. */
  public missing(handler: MissingHandler): this {
    this.meta.missing = handler
    return this
  }

  /** Scope nested child bindings to their parent. */
  public scopeBindings(): this {
    this.meta.scopeBindings = true
    return this
  }

  /** Explicitly disable scoped child bindings. */
  public withoutScopedBindings(): this {
    this.meta.withoutScopedBindings = true
    return this
  }

  /** Allow soft-deleted models to be resolved for this route. */
  public withTrashed(): this {
    this.meta.withTrashed = true
    return this
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private applyPattern(params: string[], pattern: PatternName): this {
    const constraints: Record<string, string> = {}
    for (const param of params) constraints[param] = patterns[pattern]
    return this.where(constraints)
  }
}
