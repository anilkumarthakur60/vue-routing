<script setup lang="ts">
// A second, separate layout — proves routes can live under different shells.
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <router-view />
    </div>
  </div>
</template>
