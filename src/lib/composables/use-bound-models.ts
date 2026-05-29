import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Models resolved by explicit bindings for the current navigation (populated by
 * {@link createAppRouter}). Typed via the caller's generic.
 *
 * @example const { user } = useBoundModels<{ user: User }>().value
 */
export function useBoundModels<TModels extends Record<string, unknown>>(): ComputedRef<
  Partial<TModels>
> {
  const route = useRoute()
  return computed(() => (route.meta.bound ?? {}) as Partial<TModels>)
}
