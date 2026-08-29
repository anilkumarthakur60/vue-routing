<script setup lang="ts">
// Demonstrates: Route.toList()  the flattened route registry.
import { Route } from '@anil-labs/vue-routing'

const rows = Route.toList()
</script>

<template>
  <h1>Route table</h1>
  <div class="card">
    <p><code>Route.toList()</code>  every registered route (paths shown after layout nesting).</p>
    <table>
      <thead>
        <tr>
          <th>path</th>
          <th>name</th>
          <th>middleware</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="`${row.path}|${row.name}`">
          <td>
            <code>{{ row.path }}</code>
          </td>
          <td>{{ row.name }}</td>
          <td class="muted">{{ row.middleware }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
