import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/** A reactive predicate: does the current route match the given name? */
export function useIsRoute(name: string): ComputedRef<boolean> {
  const route = useRoute()
  return computed(() => route.name === name)
}
