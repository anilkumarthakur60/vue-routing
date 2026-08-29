<script setup lang="ts">
// Demonstrates: a static segment (users/create) registered before the dynamic
// users/{user}, so it matches first.
</script>

<template>
  <h1>New user</h1>
  <div class="card">
    <p>
      Static route <code>users/create</code>  declared before <code>users/{user}</code> so it wins
      the match.
    </p>
    <router-link :to="{ name: 'users.index' }">Back</router-link>
  </div>
</template>
