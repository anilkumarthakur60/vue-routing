<script setup lang="ts">
// Demonstrates: named-route URL generation via Route.route().
import { Route } from '@anil-labs/vue-routing'

interface Example {
  call: string
  value: string
}

const examples: Example[] = [
  { call: "Route.route('users.show', { user: 2 })", value: Route.route('users.show', { user: 2 }) },
  {
    call: "Route.route('orders.show', { order: 7, ref: 'abc' })",
    value: Route.route('orders.show', { order: 7, ref: 'abc' }),
  },
  { call: "Route.route('docs')", value: Route.route('docs') },
  { call: "Route.route('docs', { slug: 'intro' })", value: Route.route('docs', { slug: 'intro' }) },
]
</script>

<template>
  <h1>Dashboard</h1>
  <p class="muted">You're authenticated — the <code>auth</code> middleware allowed this route.</p>

  <div class="card">
    <h2>URL generation — <code>Route.route(name, params)</code></h2>
    <table>
      <thead>
        <tr>
          <th>call</th>
          <th>result</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="example in examples" :key="example.call">
          <td>
            <code>{{ example.call }}</code>
          </td>
          <td>
            <code>{{ example.value }}</code>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
