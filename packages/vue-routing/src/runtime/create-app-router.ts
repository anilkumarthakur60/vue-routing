/**
 * Router factory — builds a fully-configured vue-router instance with the
 * navigation guard wired in. Keeps the consumer's `router/index.ts` declarative.
 */
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router'
import type { CreateAppRouterOptions } from '@/types'
import { createNavigationGuard } from '@/runtime/navigation-guard'
import { domainToRegExp } from '@/path'

const HISTORY_FACTORIES: Record<
  NonNullable<CreateAppRouterOptions['historyMode']>,
  (base?: string) => RouterHistory
> = {
  history: createWebHistory,
  hash: createWebHashHistory,
  memory: createMemoryHistory,
}

/**
 * Create a vue-router instance with Laravel-style middleware, domain, and
 * model-binding handling baked into a single `beforeEach` guard.
 *
 * Routes restricted with `domain()` are resolved against the effective
 * hostname (`options.hostname`, falling back to `window.location.hostname`):
 * records whose domain does not match are dropped before the router is
 * created, so the same path registered under several domains matches the
 * right record per host. SSR consumers should pass the request's `Host`
 * header as `hostname` — without it, domain filtering/validation is skipped.
 *
 * @example
 * ```ts
 * import { createAppRouter, Route } from '@anil-labs/vue-routing'
 * import routes from './web'
 *
 * export default createAppRouter({ routes, bindings: Route.getBindings() })
 * ```
 */
export function createAppRouter(options: CreateAppRouterOptions): Router {
  const {
    routes,
    historyMode = 'history',
    base = '/',
    scrollBehavior = (_to, _from, savedPosition) => savedPosition ?? { left: 0, top: 0 },
    bindings,
    hostname,
  } = options

  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : undefined)

  const router = createRouter({
    history: HISTORY_FACTORIES[historyMode](base),
    routes: host === undefined ? routes : filterByDomain(routes, host),
    scrollBehavior,
  })

  router.beforeEach(createNavigationGuard(bindings, host))

  return router
}

/**
 * Drop records whose `meta.domain` does not match the effective hostname.
 * The hostname is fixed for a page load, so resolving domains at creation
 * time is sound — and it is the only way vue-router (which matches on path
 * alone) can serve the same path registered under two different domains.
 */
function filterByDomain(records: RouteRecordRaw[], hostname: string): RouteRecordRaw[] {
  const kept: RouteRecordRaw[] = []
  for (const record of records) {
    const domain = record.meta?.domain
    if (domain !== undefined && !domainToRegExp(domain).test(hostname)) continue
    const children = (record as { children?: RouteRecordRaw[] }).children
    if (children === undefined || children.length === 0) {
      kept.push(record)
    } else {
      kept.push({ ...record, children: filterByDomain(children, hostname) })
    }
  }
  return kept
}
