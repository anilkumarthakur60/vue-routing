/** Records every navigation so the UI can show the middleware pipeline firing. */
import type { MiddlewareFn } from '@anil-labs/vue-routing'
import { pushLog } from '../data/nav-log'

const log: MiddlewareFn = (to) => {
  pushLog(`→ ${to.fullPath}`)
  return true
}

export default log
