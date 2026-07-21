<script setup lang="ts">
// Demonstrates: useBoundModels() — the {user} segment is already resolved to a
// User object by Route.bind('user', findUser) before this page renders.
import { useBoundModels } from '@anil-labs/vue-routing'
import type { User } from '../../data/users'

const models = useBoundModels<{ user: User }>()
</script>

<template>
  <template v-if="models.user">
    <h1>{{ models.user.name }}</h1>
    <div class="card">
      <p>
        Resolved by <code>Route.bind('user', findUser)</code> during navigation — no fetching in the
        component.
      </p>
      <table>
        <tbody>
          <tr>
            <th>id</th>
            <td>{{ models.user.id }}</td>
          </tr>
          <tr>
            <th>email</th>
            <td>{{ models.user.email }}</td>
          </tr>
          <tr>
            <th>role</th>
            <td>
              <span class="badge" :class="models.user.role">{{ models.user.role }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 12px">
        <router-link :to="{ name: 'users.edit', params: { user: models.user.id } }"
          >Edit</router-link
        >
        ·
        <router-link :to="{ name: 'users.index' }">Back</router-link>
      </p>
    </div>
  </template>
</template>
