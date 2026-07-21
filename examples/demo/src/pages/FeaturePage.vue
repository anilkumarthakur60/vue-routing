<script setup lang="ts">
// Generic introspection page used by many feature routes. Demonstrates the
// full composable surface in one place:
//   useRouteName · useRouteAction · useBoundModels · useSubdomainParams
import { computed } from 'vue'
import {
  useRouteName,
  useRouteAction,
  useBoundModels,
  useSubdomainParams,
} from '@anil-labs/vue-routing'
import { useRoute } from 'vue-router'

const route = useRoute()
const name = useRouteName()
const action = useRouteAction()
const bound = useBoundModels<Record<string, unknown>>()
const subdomain = useSubdomainParams()

const params = computed(() => route.params)
const query = computed(() => route.query)
const boundKeys = computed(() => Object.keys(bound.value))
const hasSubdomain = computed(() => Object.keys(subdomain.value).length > 0)

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <h1>
    Feature route <span class="muted">— {{ name ?? 'unnamed' }}</span>
  </h1>

  <div class="card">
    <p>This page reads everything from composables — no props, no fetching in the component.</p>
    <table>
      <tbody>
        <tr>
          <th>useRouteName()</th>
          <td>
            <code>{{ name ?? '—' }}</code>
          </td>
        </tr>
        <tr>
          <th>useRouteAction()</th>
          <td>
            <code>{{ action ?? '—' }}</code>
          </td>
        </tr>
        <tr>
          <th>route.params</th>
          <td>
            <pre>{{ pretty(params) }}</pre>
          </td>
        </tr>
        <tr v-if="Object.keys(query).length">
          <th>route.query</th>
          <td>
            <pre>{{ pretty(query) }}</pre>
          </td>
        </tr>
        <tr v-if="boundKeys.length">
          <th>useBoundModels()</th>
          <td>
            <pre>{{ pretty(bound) }}</pre>
          </td>
        </tr>
        <tr v-if="hasSubdomain">
          <th>useSubdomainParams()</th>
          <td>
            <pre>{{ pretty(subdomain) }}</pre>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
