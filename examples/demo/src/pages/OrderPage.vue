<script setup lang="ts">
// Demonstrates: per-route regex constraint via .whereNumber('order').
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const order = computed(() => route.params['order'])
</script>

<template>
  <h1>Order #{{ order }}</h1>
  <div class="card">
    <p>Route <code>orders/{order}</code> with <code>.whereNumber('order')</code>.</p>
    <p class="muted">
      Only digits match  <code>/orders/abc</code> fails the constraint and falls through to the 404
      fallback.
    </p>
  </div>
</template>
