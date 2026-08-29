/**
 * @anil-labs/vue-routing
 *
 * Laravel-inspired, fully-typed declarative routing for Vue 3  a fluent
 * wrapper over vue-router.
 *
 * @example Define routes (`router/web.ts`):
 * ```ts
 * import { Route } from '@anil-labs/vue-routing'
 * import MainLayout from 'src/layouts/MainLayout.vue'
 *
 * Route.middleware(auth).layout(MainLayout).group(() => {
 *   Route.redirect('', '/dashboard')
 *   Route.view('dashboard', () => import('src/pages/Dashboard.vue')).name('dashboard')
 *   Route.resource('users', UsersPage, { only: ['index', 'show'] })
 * })
 *
 * export default Route.getRoutes()
 * ```
 *
 * @example Create the router (`router/index.ts`):
 * ```ts
 * import { createAppRouter, Route } from '@anil-labs/vue-routing'
 * import routes from './web'
 *
 * export default createAppRouter({ routes, bindings: Route.getBindings() })
 * ```
 */

// Facade + fluent builder classes
export {
  Route,
  Router,
  createRouteFacade,
  RouteRegistrar,
  RouteDefinition,
  PendingResourceRegistration,
  PendingSingletonRegistration,
  PendingResourceCollection,
} from '@/builder'

// Router factory + runtime helpers
export { createAppRouter, createNavigationGuard, collectMiddleware, runMiddleware } from '@/runtime'

// Composables
export {
  useRouteName,
  useRouteAction,
  useIsRoute,
  useBoundModels,
  useSubdomainParams,
} from '@/composables'

// Constants + their types
export {
  RESOURCE_ACTIONS,
  RESOURCE_ACTION_MAP,
  SINGLETON_ACTIONS,
  SINGLETON_ACTION_MAP,
  patterns,
} from '@/constants'
export type {
  ResourceAction,
  ResourceActionConfig,
  SingletonAction,
  PatternName,
} from '@/constants'

// Public types
export type {
  RouteComponent,
  GuardResult,
  MiddlewareFn,
  MissingHandler,
  BindingResolver,
  BindingResolverContext,
  AppRouteMeta,
  GroupAttributes,
  ResolvedContext,
  ResourceOptions,
  SingletonOptions,
  HistoryMode,
  CreateAppRouterOptions,
  NamedRouteEntry,
  RegisteredRoute,
  RouteDefinitionHost,
} from '@/types'
export type { RouteListRow } from '@/registry'

// Tree-shakeable pure utilities
export { splitWords, pluralize, singularize, appendRouteName } from '@/text'
export {
  collapseSlashes,
  ensureLeadingSlash,
  joinPaths,
  convertLaravelParams,
  extractBindingFields,
  extractParamNames,
  compileUrl,
  applyWhereConstraints,
} from '@/path'
export type { ParamValue, ParamValueInput, ParamToken } from '@/path'

// Default export  the singleton facade, like Laravel's `Route`.
export { Route as default } from '@/builder'
