/**
 * Pure builders that turn a {@link ResolvedContext} + inputs into a vue-router
 * record. No state, no tree, no naming — just "what the record looks like".
 */
import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import type { MiddlewareFn, ResolvedContext, RouteComponent } from '@/types'
import type { ResourceAction } from '@/constants'
import {
  applyWhereConstraints,
  compileUrl,
  convertLaravelParams,
  extractBindingFields,
  extractParamNames,
  joinPaths,
  type ParamValueInput,
} from '@/path'

/** A built record plus its clean absolute path (for naming / URL generation). */
export interface BuiltRecord {
  record: RouteRecordRaw
  absolutePath: string
}

/** The slice of the source location a redirect target resolver needs. */
interface RedirectContext {
  params: Record<string, string | string[]>
}

/**
 * Never rendered — a placeholder component so middleware-carrying redirects
 * are matchable records (see {@link buildRedirectRecord}).
 */
const RedirectPassThrough: RouteComponent = {
  name: 'RedirectPassThrough',
  render: (): null => null,
}

/** The group middleware that actually applies, minus anything excluded. */
function applicableMiddleware(context: ResolvedContext): MiddlewareFn[] {
  if (context.excludedMiddleware.length === 0) return [...context.middleware]
  const excluded = new Set(context.excludedMiddleware)
  return context.middleware.filter((middleware) => !excluded.has(middleware))
}

/** Build a navigable (GET) component record. */
export function buildRouteRecord(
  context: ResolvedContext,
  uri: string,
  component: RouteComponent,
  globalPatterns: Record<string, string>,
  action?: ResourceAction,
): BuiltRecord {
  const absolutePath = joinPaths(context.prefix, convertLaravelParams(uri))
  const routingPath = applyWhereConstraints(absolutePath, context.where, globalPatterns)

  const meta: RouteMeta = {
    middleware: applicableMiddleware(context),
    where: context.where,
    scopeBindings: context.scopeBindings,
    withoutScopedBindings: context.withoutScopedBindings,
  }
  if (context.excludedMiddleware.length) meta.excludedMiddleware = [...context.excludedMiddleware]
  // Group-prefix binding fields merge with the leaf URI's (leaf wins).
  const bindingFields = { ...context.bindingFields, ...extractBindingFields(uri) }
  if (Object.keys(bindingFields).length) meta.bindingFields = bindingFields
  if (action !== undefined) meta.action = action
  if (context.domain !== undefined) meta.domain = context.domain
  if (context.missing !== undefined) meta.missing = context.missing

  const record = { path: routingPath, component, props: true, meta } as RouteRecordRaw
  return { record, absolutePath }
}

/** Build a redirect record. */
export function buildRedirectRecord(
  context: ResolvedContext,
  from: string,
  to: string,
  status: number,
): BuiltRecord {
  const absolutePath = joinPaths(context.prefix, convertLaravelParams(from))
  // `where()` constraints must gate the redirect too — otherwise
  // `whereNumber('id')` around a redirect is a silent no-op.
  const routingPath = applyWhereConstraints(absolutePath, context.where, {})

  const meta: RouteMeta = { redirectStatus: status, isRedirect: true }
  if (Object.keys(context.where).length) meta.where = context.where
  if (context.domain !== undefined) meta.domain = context.domain
  const middleware = applicableMiddleware(context)
  if (middleware.length) meta.middleware = middleware
  if (context.excludedMiddleware.length) meta.excludedMiddleware = [...context.excludedMiddleware]

  const target = redirectTarget(to)

  let record: RouteRecordRaw
  if (middleware.length > 0) {
    // vue-router resolves `redirect` fields during location resolution — the
    // record never appears in `to.matched`, so guards (and therefore
    // middleware) can never run for it. When middleware applies, emit a
    // matchable pass-through record instead: the navigation guard sees it and
    // runs the middleware pipeline, then `beforeEnter` performs the redirect.
    const beforeEnter = (loc: RedirectContext): string =>
      typeof target === 'string' ? target : target(loc.params)
    record = { path: routingPath, component: RedirectPassThrough, beforeEnter, meta }
  } else {
    const redirect =
      typeof target === 'string' ? target : (loc: RedirectContext): string => target(loc.params)
    record = { path: routingPath, redirect, meta }
  }
  return { record, absolutePath }
}

/**
 * Build the redirect target resolver. Static targets stay plain strings (so
 * devtools output remains readable); targets with params compile against the
 * source location's params — a vue-router string redirect is treated as a
 * literal path, so `/new/{id}` would otherwise navigate to the literal string.
 * Only params the target actually uses are forwarded, so unshared source
 * params never leak into the target's query string.
 */
function redirectTarget(
  to: string,
): string | ((params: Record<string, string | string[]>) => string) {
  const target = convertLaravelParams(to)
  const tokens = extractParamNames(target)
  if (tokens.length === 0) return target

  const names = new Set(tokens.map((token) => token.name))
  return (params) => {
    const values: Record<string, ParamValueInput> = {}
    for (const [key, value] of Object.entries(params)) {
      if (!names.has(key)) continue
      // Arrays pass through whole — compileUrl expands repeatable params into
      // one encoded segment per element, so catch-all redirects keep every segment.
      values[key] = value
    }
    return compileUrl(target, values)
  }
}

/**
 * Build the fallback (404) record, scoped to the active group prefix
 * (Laravel applies the group prefix to `Route::fallback`). The name is
 * supplied by the registry so it can be scoped to the group's name prefix.
 */
export function buildFallbackRecord(
  context: ResolvedContext,
  component: RouteComponent,
  name: string,
): BuiltRecord {
  const meta: RouteMeta = { isFallback: true, middleware: applicableMiddleware(context) }
  if (context.excludedMiddleware.length) meta.excludedMiddleware = [...context.excludedMiddleware]
  if (context.missing !== undefined) meta.missing = context.missing

  const path = joinPaths(context.prefix, '/:pathMatch(.*)*')
  const record = { path, name, component, meta } as RouteRecordRaw
  return { record, absolutePath: path }
}
