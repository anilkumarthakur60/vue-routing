/**
 * Resource routing constants.
 *
 * This is a CLIENT-SIDE router: only the navigable (page-rendering) resource
 * actions exist. `store` / `update` / `destroy` are server-side mutations with
 * no page, so they are intentionally omitted.
 */

/** The navigable resource actions, in canonical order. */
export const RESOURCE_ACTIONS = ['index', 'create', 'show', 'edit'] as const

/** A single navigable resource action. */
export type ResourceAction = (typeof RESOURCE_ACTIONS)[number]

/** How a resource action maps to a URI suffix. */
export interface ResourceActionConfig {
  readonly uri: string
}

/**
 * Canonical resource map. URIs use Laravel `{param}` syntax; the path compiler
 * converts them to vue-router `:param` syntax at registration time.
 */
export const RESOURCE_ACTION_MAP: Readonly<Record<ResourceAction, ResourceActionConfig>> = {
  index: { uri: '' },
  create: { uri: '/create' },
  show: { uri: '/{id}' },
  edit: { uri: '/{id}/edit' },
}
