/**
 * Pure builders that turn a {@link ResolvedContext} + inputs into a vue-router
 * record. No state, no tree, no naming — just "what the record looks like".
 */
import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import type { ResolvedContext, RouteComponent } from '@/lib/types'
import { applyWhereConstraints, convertLaravelParams, joinPaths } from '@/lib/path'

/** A built record plus its clean absolute path (for naming / URL generation). */
export interface BuiltRecord {
  record: RouteRecordRaw
  absolutePath: string
}

/** Build a navigable (GET) component record. */
export function buildRouteRecord(
  context: ResolvedContext,
  uri: string,
  component: RouteComponent,
  globalPatterns: Record<string, string>,
  action?: string,
): BuiltRecord {
  const absolutePath = joinPaths(context.prefix, convertLaravelParams(uri))
  const routingPath = applyWhereConstraints(absolutePath, context.where, globalPatterns)

  const meta: RouteMeta = {
    middleware: [...context.middleware],
    where: context.where,
    scopeBindings: context.scopeBindings,
    withoutScopedBindings: context.withoutScopedBindings,
  }
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

  const meta: RouteMeta = { redirectStatus: status, isRedirect: true }
  if (context.middleware.length) meta.middleware = [...context.middleware]

  const record = { path: absolutePath, redirect: to, meta } as RouteRecordRaw
  return { record, absolutePath }
}

/** Build the fallback (404) record. */
export function buildFallbackRecord(
  context: ResolvedContext,
  component: RouteComponent,
): BuiltRecord {
  const meta: RouteMeta = { isFallback: true, middleware: [...context.middleware] }
  if (context.missing !== undefined) meta.missing = context.missing

  const path = '/:pathMatch(.*)*'
  const record = { path, name: 'NotFound', component, meta } as RouteRecordRaw
  return { record, absolutePath: path }
}
