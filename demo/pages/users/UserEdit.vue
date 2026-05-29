<script setup lang="ts">
// Demonstrates: a bound model on a nested dynamic route ({user}/edit).
import { useBoundModels } from '@anil-labs/vue-routing'
import type { User } from '../../data/users'

const models = useBoundModels<{ user: User }>()
</script>

<template>
  <h1>Edit user</h1>
  <div class="card">
    <p v-if="models.user">
      Editing <b>{{ models.user.name }}</b
      >, bound from <code>users/{user}/edit</code>.
    </p>
    <p class="muted">Saving would POST to your API — outside this client router's scope.</p>
    <router-link :to="{ name: 'users.index' }">Back</router-link>
  </div>
</template>
