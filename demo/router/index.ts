/** Builds the vue-router instance from the declarative route definitions. */
import { createAppRouter, Route } from '@anil-labs/vue-routing'
import routes from './web'

export default createAppRouter({
  routes,
  historyMode: 'history',
  // Enables the `Route.bind('user', …)` resolver to run during navigation.
  bindings: Route.getBindings(),
})
