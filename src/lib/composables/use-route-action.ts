import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/**
 * The current route's resourceful action (`index`, `show`, `create`, `edit`, …)
 * when it was registered via `resource()` / `singleton()`, else `undefined`.
 * Mirrors Laravel's `currentRouteAction()`. Reactive; call within `setup()`.
 */
export function useRouteAction(): ComputedRef<string | undefined> {
  const route = useRoute()
  return computed(() => route.meta.action)
}
