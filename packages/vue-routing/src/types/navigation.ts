import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

/**
 * Navigation-guard result (vue-router style — no `next()` callback):
 * - `void` / `true`      → allow navigation
 * - `false`              → cancel navigation
 * - `RouteLocationRaw`   → redirect
 */
export type GuardResult = void | boolean | RouteLocationRaw

/** A per-route or per-group middleware function. Return a value, never call `next()`. */
export type MiddlewareFn = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) => GuardResult | Promise<GuardResult>

/** Handler invoked when a bound model cannot be resolved (Laravel's `missing()`). */
export type MissingHandler = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) => void | RouteLocationRaw

/**
 * Extra, fully client-side context handed to a {@link BindingResolver}. None of
 * it touches a database — it just gives your resolver enough information to scope
 * its own `fetch` the way Laravel scopes a DB query.
 */
export interface BindingResolverContext {
  /**
   * The custom key from a `{param:field}` segment (Laravel's `:field`), e.g.
   * `slug` for `{post:slug}`. `undefined` when no custom key was given.
   */
  field: string | undefined
  /**
   * The nearest already-resolved parent model, present only when the route
   * opted into scoped bindings via `scopeBindings()`. Lets a child resolver
   * scope itself by its parent (e.g. `GET /users/{user.id}/posts?slug=…`).
   */
  parent: unknown
  /** Every model resolved so far for this navigation, keyed by parameter name. */
  bound: Readonly<Record<string, unknown>>
}

/**
 * Explicit route-model binding resolver (Laravel's `Route::bind` / `Route::model`).
 * Receives the raw URI segment value and resolves the bound model, or `null`
 * to signal "not found" (which triggers the route's `missing()` handler).
 *
 * The resolver is your own (typically async) lookup — usually an API call — so
 * the wrapper stays free of any database concern.
 */
export type BindingResolver<TModel = unknown> = (
  value: string,
  to: RouteLocationNormalized,
  context: BindingResolverContext,
) => TModel | null | Promise<TModel | null>
