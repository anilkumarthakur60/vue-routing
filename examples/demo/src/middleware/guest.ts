/** Keeps authenticated users out of guest-only pages (e.g. login). */
import type { MiddlewareFn } from '@anil-labs/vue-routing'
import { isAuthenticated } from '../data/auth'

const guest: MiddlewareFn = () => (isAuthenticated.value ? { name: 'dashboard' } : true)

export default guest
