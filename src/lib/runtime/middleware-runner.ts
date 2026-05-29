/**
 * Middleware execution engine.
 *
 * Collects middleware from every matched record (layouts + page), removes any
 * explicitly excluded via `withoutMiddleware()`, de-duplicates, then runs the
 * pipeline sequentially. The first non-`true`/non-`undefined` result wins.
 */
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'
import type { MiddlewareFn } from '@/lib/types'

/** Gather the ordered, de-duplicated middleware chain for a navigation target. */
export function collectMiddleware(to: RouteLocationNormalized): MiddlewareFn[] {
  const excluded = new Set<MiddlewareFn>()
  for (const record of to.matched) {
    for (const mw of record.meta.excludedMiddleware ?? []) excluded.add(mw)
  }

  const seen = new Set<MiddlewareFn>()
  const chain: MiddlewareFn[] = []
  for (const record of to.matched) {
    for (const mw of record.meta.middleware ?? []) {
      if (excluded.has(mw) || seen.has(mw)) continue
      seen.add(mw)
      chain.push(mw)
    }
  }
  return chain
}

/** Run the middleware pipeline; first redirect/cancel result wins. */
export async function runMiddleware(
  middlewares: readonly MiddlewareFn[],
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<NavigationGuardReturn> {
  for (const middleware of middlewares) {
    const result = await middleware(to, from)
    if (result !== undefined && result !== true) {
      return result
    }
  }
  return undefined
}
