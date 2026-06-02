import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/**
 * A reactive predicate: does the current route's name match any of the given
 * patterns? Patterns may use `*` as a wildcard (Laravel's `request()->routeIs()`),
 * so `useIsRoute('users.*')` is true for `users.index`, `users.show`, etc.
 */
export function useIsRoute(...patterns: string[]): ComputedRef<boolean> {
  const matchers = patterns.map(toMatcher)
  const route = useRoute()
  return computed(() => {
    const name = route.name
    return typeof name === 'string' && matchers.some((matches) => matches(name))
  })
}

/** Compile a name pattern (with optional `*` wildcards) into a predicate. */
function toMatcher(pattern: string): (name: string) => boolean {
  if (!pattern.includes('*')) return (name) => name === pattern
  const source = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  const regExp = new RegExp(`^${source}$`)
  return (name) => regExp.test(name)
}
