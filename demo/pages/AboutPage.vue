<script setup lang="ts">
// Demonstrates: static props passed through Route.view(uri, comp, props).
defineProps<{ version?: string }>()
</script>

<template>
  <h1>About</h1>
  <div class="card">
    <p>
      Registered with static props:
      <code>Route.view('about', AboutPage, { version: '1.0.0' })</code>.
    </p>
    <p>
      Received <code>version</code> prop: <b>{{ version ?? 'n/a' }}</b>
    </p>
  </div>
</template>
