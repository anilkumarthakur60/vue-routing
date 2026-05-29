/** Redirects unauthenticated visitors to login, preserving the intended URL. */
import type { MiddlewareFn } from '@anil-labs/vue-routing'
import { isAuthenticated } from '../data/auth'

const auth: MiddlewareFn = (to) => {
  if (isAuthenticated.value) return true
  return { name: 'login', query: { redirect: to.fullPath } }
}

export default auth
