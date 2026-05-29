/** Tiny reactive auth state to drive the `auth` / `guest` middleware demos. */
import { computed, ref, type ComputedRef } from 'vue'

const authenticated = ref(false)

export const isAuthenticated: ComputedRef<boolean> = computed(() => authenticated.value)

export function login(): void {
  authenticated.value = true
}

export function logout(): void {
  authenticated.value = false
}
