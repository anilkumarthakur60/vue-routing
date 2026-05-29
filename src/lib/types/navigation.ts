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
 * Explicit route-model binding resolver (Laravel's `Route::bind` / `Route::model`).
 * Receives the raw URI segment value and resolves the bound model, or `null`
 * to signal "not found" (which triggers the route's `missing()` handler).
 */
export type BindingResolver<TModel = unknown> = (
  value: string,
  to: RouteLocationNormalized,
) => TModel | null | Promise<TModel | null>
