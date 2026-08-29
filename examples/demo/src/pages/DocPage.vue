<script setup lang="ts">
// Demonstrates: optional route parameter  docs/{slug?}
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = computed(() => {
  const value = route.params['slug']
  return typeof value === 'string' ? value : ''
})
</script>

<template>
  <h1>Docs</h1>
  <div class="card">
    <p>Optional parameter route <code>docs/{slug?}</code>.</p>
    <p v-if="slug">
      Viewing doc: <b>{{ slug }}</b>
    </p>
    <p v-else class="muted">
      No slug  both <code>/docs</code> and <code>/docs/anything</code> match this route.
    </p>
    <div class="pill-row">
      <router-link class="btn" :to="{ name: 'docs' }">/docs</router-link>
      <router-link class="btn" :to="{ name: 'docs', params: { slug: 'getting-started' } }">
        /docs/getting-started
      </router-link>
    </div>
  </div>
</template>
