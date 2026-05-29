/**
 * Router factory — builds a fully-configured vue-router instance with the
 * navigation guard wired in. Keeps the consumer's `router/index.ts` declarative.
 */
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type Router,
  type RouterHistory,
} from 'vue-router'
import type { CreateAppRouterOptions } from '@/lib/types'
import { createNavigationGuard } from '@/lib/runtime/navigation-guard'

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
    scrollBehavior = () => ({ left: 0, top: 0 }),
    bindings,
  } = options

  const router = createRouter({
    history: HISTORY_FACTORIES[historyMode](base),
    routes,
    scrollBehavior,
  })

  router.beforeEach(createNavigationGuard(bindings))

  return router
}
