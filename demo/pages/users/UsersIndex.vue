<script setup lang="ts">
// Demonstrates: prefix + name-prefix group, and links into bound routes.
import { allUsers } from '../../data/users'

const users = allUsers()
</script>

<template>
  <h1>Users</h1>
  <div class="card">
    <p>
      A group with <code>prefix('users').asPrefix('users')</code> plus an explicit model binding on
      the <code>{user}</code> segment.
    </p>
    <router-link class="btn btn-primary" :to="{ name: 'users.create' }">New user</router-link>

    <table style="margin-top: 14px">
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>role</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>
            <span class="badge" :class="user.role">{{ user.role }}</span>
          </td>
          <td>
            <router-link :to="{ name: 'users.show', params: { user: user.id } }">view</router-link>
            ·
            <router-link :to="{ name: 'users.edit', params: { user: user.id } }">edit</router-link>
          </td>
        </tr>
      </tbody>
    </table>

    <p class="muted" style="margin-top: 12px">
      Try
      <router-link :to="{ name: 'users.show', params: { user: 999 } }">user #999</router-link>
      — the binding resolves to <code>null</code>, so the route's <code>missing()</code> handler
      redirects back here.
    </p>
  </div>
</template>
