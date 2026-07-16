<script setup lang="ts">
// Demonstrates: Route.fallback() — matches /:pathMatch(.*)* for unknown URLs.
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div>
      <div class="error-code">404</div>
      <h1>Page not found</h1>
      <p class="muted">Registered via <code>Route.fallback(NotFoundPage)</code>.</p>
      <button class="btn btn-primary" @click="() => router.push('/dashboard')">Go home</button>
    </div>
  </div>
</template>
