import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/** The current route's name (reactive), or `undefined` for unnamed routes. */
export function useRouteName(): ComputedRef<string | undefined> {
  const route = useRoute()
  return computed(() => (typeof route.name === 'string' ? route.name : undefined))
}
