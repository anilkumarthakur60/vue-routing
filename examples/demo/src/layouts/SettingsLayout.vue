<script setup lang="ts">
// NESTED layout: rendered inside MainLayout's <router-view>, and itself renders
// its child pages through its own <router-view>. Demonstrates layout nesting
// (MainLayout › SettingsLayout › page) with nested routing (settings.* tabs).
import { useRouteName } from '@anil-labs/vue-routing'

const routeName = useRouteName()
</script>

<template>
  <h1>Settings</h1>
  <p class="muted">
    Nested layout  <code>MainLayout › SettingsLayout › page</code>. The tabs are nested routes
    rendered through this layout's own <code>&lt;router-view&gt;</code>.
  </p>

  <div class="card">
    <nav class="subnav">
      <router-link :to="{ name: 'settings.profile' }">Profile</router-link>
      <router-link :to="{ name: 'settings.security' }">Security</router-link>
      <router-link :to="{ name: 'settings.notifications' }">Notifications</router-link>
    </nav>

    <div class="subview">
      <router-view />
    </div>
  </div>

  <p class="muted">
    active nested route: <b>{{ routeName }}</b>
  </p>
</template>
