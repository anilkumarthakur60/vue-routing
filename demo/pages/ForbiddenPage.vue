<script setup lang="ts">
// A public route registered with no layout (renders full-screen).
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div>
      <div class="error-code">403</div>
      <h1>Forbidden</h1>
      <p class="muted">A standalone route — registered outside any layout group.</p>
      <button class="btn btn-primary" @click="() => router.push('/dashboard')">
        Go to dashboard
      </button>
    </div>
  </div>
</template>
