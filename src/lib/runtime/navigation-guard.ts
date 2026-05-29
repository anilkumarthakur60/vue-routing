/**
 * Builds the single `beforeEach` guard that runs, in order:
 * subdomain checks → middleware pipeline → explicit model-binding resolution
 * (with `missing()` fallback). Extracted from the factory so it is unit-testable
 * in isolation.
 */
import type { NavigationGuard, NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'
import type { BindingResolver, MissingHandler } from '@/lib/types'
import { collectMiddleware, runMiddleware } from '@/lib/runtime/middleware-runner'

/** Create the navigation guard, optionally resolving model bindings. */
export function createNavigationGuard(bindings?: Map<string, BindingResolver>): NavigationGuard {
  return async (to, from) => {
    const domainResult = checkDomains(to)
    if (domainResult !== undefined) return domainResult

    const middlewareResult = await runMiddleware(collectMiddleware(to), to, from)
    if (middlewareResult !== undefined && middlewareResult !== true) return middlewareResult

    if (bindings && bindings.size > 0) {
      return resolveBindings(bindings, to, from)
    }

    return true
  }
}

/** Verify the current hostname satisfies every matched route's domain pattern. */
function checkDomains(to: RouteLocationNormalized): NavigationGuardReturn {
  if (typeof window === 'undefined') return undefined
  for (const record of to.matched) {
    const domain = record.meta.domain
    if (!domain) continue
    const pattern = domain.replace(/\{[^}]+\}/g, '([^.]+)')
    if (!new RegExp(`^${pattern}$`).test(window.location.hostname)) {
      return false
    }
  }
  return undefined
}

/**
 * Resolve every route parameter that has a registered binding, attaching the
 * resolved models to the merged location meta (`to.meta.bound`). If any
 * resolver returns `null`/`undefined`, the route's `missing()` handler runs (or
 * navigation is cancelled).
 */
async function resolveBindings(
  bindings: Map<string, BindingResolver>,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<NavigationGuardReturn> {
  const bound: Record<string, unknown> = {}

  for (const [param, value] of Object.entries(to.params)) {
    const resolver = bindings.get(param)
    if (!resolver) continue

    const raw = Array.isArray(value) ? value[0] : value
    if (raw === undefined) continue

    const model = await resolver(raw, to)
    if (model === null || model === undefined) {
      return handleMissing(to, from)
    }
    bound[param] = model
  }

  to.meta.bound = bound
  return true
}

/** Run the nearest `missing()` handler, or cancel navigation. */
function handleMissing(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): NavigationGuardReturn {
  const missing = findMissingHandler(to)
  if (missing) {
    const result = missing(to, from)
    return result ?? false
  }
  return false
}

function findMissingHandler(to: RouteLocationNormalized): MissingHandler | undefined {
  for (let i = to.matched.length - 1; i >= 0; i--) {
    const handler = to.matched[i]?.meta.missing
    if (handler) return handler
  }
  return undefined
}
