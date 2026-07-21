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
 * Canonical resource map. The literal `{param}` placeholder is replaced with the
 * resource's actual route parameter (the singularized name, e.g. `{user}`) at
 * registration time; the path compiler then converts `{user}` → `:user`.
 */
export const RESOURCE_ACTION_MAP: Readonly<Record<ResourceAction, ResourceActionConfig>> = {
  index: { uri: '' },
  create: { uri: '/create' },
  show: { uri: '/{param}' },
  edit: { uri: '/{param}/edit' },
}

/**
 * The navigable singleton-resource actions (Laravel's `Route::singleton`). A
 * singleton has no identifier, so `show` is the bare resource URI. `create` is
 * only registered when the singleton is `creatable`.
 */
export const SINGLETON_ACTIONS = ['create', 'show', 'edit'] as const

/** A single navigable singleton-resource action. */
export type SingletonAction = (typeof SINGLETON_ACTIONS)[number]

/** Canonical singleton-resource map — note `show` carries no `{param}`. */
export const SINGLETON_ACTION_MAP: Readonly<Record<SingletonAction, ResourceActionConfig>> = {
  create: { uri: '/create' },
  show: { uri: '' },
  edit: { uri: '/edit' },
}
