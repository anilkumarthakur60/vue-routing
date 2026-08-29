<script setup lang="ts">
// Demonstrates: guest middleware + redirect-back via the ?redirect query.
import { useRoute, useRouter } from 'vue-router'
import { login } from '../data/auth'

const route = useRoute()
const router = useRouter()

function onLogin(): void {
  login()
  const redirect = route.query['redirect']
  void router.push(typeof redirect === 'string' ? redirect : '/dashboard')
}
</script>

<template>
  <h1>Sign in</h1>
  <p class="muted">
    No real auth here  click to authenticate. The <code>guest</code> middleware sent you here; the
    <code>auth</code> middleware lets you back to the page you wanted.
  </p>
  <button class="btn btn-primary" style="width: 100%; margin-top: 12px" @click="onLogin">
    Log in
  </button>
</template>
