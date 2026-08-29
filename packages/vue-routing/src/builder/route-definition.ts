/**
 * A single registered route, exposing Laravel's per-route fluent chain
 * (`->name()`, `->middleware()`, `->where()`, `->missing()`, …).
 *
 * Wraps a {@link RegisteredRoute} produced by the registry and mutates its
 * underlying record in place. It depends only on the {@link RouteDefinitionHost}
 * contract, never on the concrete registry.
 */
import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import type { MiddlewareFn, MissingHandler, RegisteredRoute, RouteDefinitionHost } from '@/types'
import type { PatternName } from '@/constants'
import { applyWhereConstraints, patternConstraints, type ParamValue } from '@/path'
import { appendRouteName } from '@/text'
import { whereInPattern } from '@/builder/where-in'

export class RouteDefinition {
  /** The underlying vue-router record this definition wraps. */
  public readonly record: RouteRecordRaw
  private readonly absolutePath: string
  private readonly namePrefix: string
  private readonly host: RouteDefinitionHost
  /** The name currently registered for this route (tracked so renames clean up). */
  private assignedName?: string

  constructor(registered: RegisteredRoute, host: RouteDefinitionHost) {
    this.record = registered.record
    this.absolutePath = registered.absolutePath
    this.namePrefix = registered.namePrefix
    this.host = host
    // A record can arrive pre-named (the fallback's auto-registered
    // 'NotFound')  track it so a later .name() removes the stale entry.
    this.assignedName =
      typeof registered.record.name === 'string' ? registered.record.name : undefined
  }

  /** Lazily-initialized, always-present meta object for this record. */
  private get meta(): RouteMeta {
    return (this.record.meta ??= {})
  }

  // ── Naming ──────────────────────────────────────────────────────────────────

  /**
   * Assign a name, prefixed by any enclosing group name. Names must be unique.
   * Renaming unregisters the previous name so no stale alias survives  the
   * registry and vue-router always agree on which name resolves this route.
   */
  public name(value: string): this {
    const fullName = appendRouteName(this.namePrefix, value)
    if (this.assignedName === fullName) return this
    if (this.assignedName !== undefined) this.host.unregisterName(this.assignedName)
    this.record.name = fullName
    this.host.registerName(fullName, { record: this.record, absolutePath: this.absolutePath })
    this.assignedName = fullName
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

  /**
   * Constrain route parameters with raw regular expressions.
   *
   * Recompiles the routing path from the clean absolute path so re-constraining
   * an already-constrained param is last-write-wins  the path and `meta.where`
   * can never silently diverge. Inline regex written directly in the URI keeps
   * precedence (the compiler never overwrites it).
   */
  public where(constraints: Record<string, string>): this {
    const where = { ...(this.meta.where ?? {}), ...constraints }
    this.meta.where = where
    const constrained = applyWhereConstraints(this.absolutePath, where, this.host.globalPatterns)
    // Layout children were stripped of their leading slash when placed in the
    // tree  preserve whichever shape the record currently has.
    this.record.path = this.record.path.startsWith('/')
      ? constrained
      : constrained.replace(/^\//, '')
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

  /** Constrain a parameter to one of a fixed set of literal values. */
  public whereIn(param: string, values: readonly string[]): this {
    return this.where({ [param]: whereInPattern(values) })
  }

  // ── Model binding modifiers ────────────────────────────────────────────────

  /** Provide a handler for when a bound model cannot be resolved. */
  public missing(handler: MissingHandler): this {
    this.meta.missing = handler
    return this
  }

  // ── URL generation ────────────────────────────────────────────────────────

  /**
   * Provide default values for route parameters, used during URL generation
   * when a value is not supplied (Laravel's `->defaults()`). Accepts either a
   * single `key`/`value` pair or a map.
   */
  public defaults(key: string, value: ParamValue): this
  public defaults(values: Record<string, ParamValue>): this
  public defaults(keyOrValues: string | Record<string, ParamValue>, value?: ParamValue): this {
    const next = { ...(this.meta.defaults ?? {}) }
    if (typeof keyOrValues === 'string') {
      if (value !== undefined) next[keyOrValues] = value
    } else {
      Object.assign(next, keyOrValues)
    }
    this.meta.defaults = next
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

  // ── Internals ────────────────────────────────────────────────────────────────

  private applyPattern(params: string[], pattern: PatternName): this {
    return this.where(patternConstraints(params, pattern))
  }
}
