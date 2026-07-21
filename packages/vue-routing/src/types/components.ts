import type { Component } from 'vue'

/**
 * A route component: either an eagerly-imported Vue component or a lazy
 * `() => import('...')` loader returning a module with a default export.
 */
export type RouteComponent = Component | (() => Promise<{ default: Component }>)
