<script setup lang="ts">
// Demonstrates: nested-layout wrapping, useRouteName composable, and reading
// the navigation log produced by the `log` middleware.
import { useRouteName } from '@anil-labs/vue-routing'
import { useRouter } from 'vue-router'
import { logout } from '../data/auth'
import { navLog } from '../data/nav-log'

const routeName = useRouteName()
const router = useRouter()

function onLogout(): void {
  logout()
  void router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        @anil-labs/vue-routing
        <small>interactive demo</small>
      </div>

      <nav class="nav">
        <router-link :to="{ name: 'dashboard' }">Dashboard</router-link>
        <router-link :to="{ name: 'about' }">About (props)</router-link>

        <div class="nav-group">Params</div>
        <router-link :to="{ name: 'docs' }">Docs (optional)</router-link>
        <router-link :to="{ name: 'orders.show', params: { order: 42 } }">
          Order #42 (numeric)
        </router-link>

        <div class="nav-group">Resource</div>
        <router-link :to="{ name: 'posts.index' }">Posts</router-link>

        <div class="nav-group">Model binding</div>
        <router-link :to="{ name: 'users.index' }">Users</router-link>

        <div class="nav-group">Tooling</div>
        <router-link :to="{ name: 'routes' }">Route table</router-link>
        <router-link :to="{ name: 'error.forbidden' }">403 page</router-link>
        <router-link to="/this/does/not/exist">Trigger 404</router-link>
      </nav>

      <div>
        <div class="nav-group">Navigation log (middleware)</div>
        <div class="log">
          <div v-for="(entry, i) in navLog" :key="i">{{ entry }}</div>
        </div>
      </div>
    </aside>

    <main class="content">
      <div class="topbar">
        <span class="current">
          current route: <b>{{ routeName ?? '—' }}</b>
        </span>
        <button @click="onLogout">Log out</button>
      </div>

      <router-view />
    </main>
  </div>
</template>
