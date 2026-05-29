import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Parameters captured from the subdomain for the current route's `domain`
 * pattern (e.g. `{account}.example.com` → `{ account: 'acme' }`).
 */
export function useSubdomainParams(): ComputedRef<Record<string, string>> {
  const route = useRoute()
  return computed(() => {
    if (typeof window === 'undefined') return {}
    for (const record of route.matched) {
      const domain = record.meta.domain
      if (!domain) continue
      const names = [...domain.matchAll(/\{(\w+)\}/g)].map((match) => match[1])
      const pattern = domain.replace(/\{\w+\}/g, '([^.]+)')
      const result = new RegExp(`^${pattern}$`).exec(window.location.hostname)
      if (!result) continue
      const params: Record<string, string> = {}
      names.forEach((name, index) => {
        const captured = result[index + 1]
        if (name !== undefined && captured !== undefined) params[name] = captured
      })
      return params
    }
    return {}
  })
}
