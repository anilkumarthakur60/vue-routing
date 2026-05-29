/** Reactive log of navigations, populated by the `log` middleware. */
import { reactive } from 'vue'

export const navLog = reactive<string[]>([])

export function pushLog(message: string): void {
  navLog.unshift(message)
  if (navLog.length > 12) navLog.length = 12
}
