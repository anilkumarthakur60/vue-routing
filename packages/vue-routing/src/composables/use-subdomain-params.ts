import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import { matchDomain } from '@/path'

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
      const params = matchDomain(domain, window.location.hostname)
      if (params) return params
    }
    return {}
  })
}
