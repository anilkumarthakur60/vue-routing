<script setup lang="ts">
// Demonstrates: nested-layout wrapping, useRouteName, wildcard useIsRoute for
// active-section detection, Route.route() URL generation (with defaults), and
// reading the navigation log produced by the `log` middleware.
import { computed } from 'vue'
import { Route, useRouteName, useIsRoute } from '@anil-labs/vue-routing'
import { useRouter } from 'vue-router'
import { logout } from '../data/auth'
import { navLog } from '../data/nav-log'

const routeName = useRouteName()
const router = useRouter()

// Wildcard route matching (Laravel's `routeIs`) → highlight the active section.
const inResources = useIsRoute('posts.*', 'users.*', 'tags.*', 'labels.*', 'photos.comments.*')
const inSettings = useIsRoute('settings.*')
const inFeatures = useIsRoute(
  'profile.*',
  'tokens.show',
  'plans.show',
  'welcome',
  'status',
  'articles.show',
)
const section = computed(() =>
  inResources.value
    ? 'resources'
    : inSettings.value
      ? 'settings'
      : inFeatures.value
        ? 'features'
        : 'core',
)

// URL generation with a default param: yields `/en/welcome` (no locale passed).
const welcomeUrl = Route.route('welcome')
// A valid UUID for the whereUuid-constrained route.
const sampleToken = '11111111-1111-1111-1111-111111111111'

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

        <div class="nav-group">Params &amp; constraints</div>
        <router-link :to="{ name: 'docs' }">Docs (optional)</router-link>
        <router-link :to="{ name: 'orders.show', params: { order: 42 } }">
          Order #42 (numeric)
        </router-link>
        <router-link :to="{ name: 'tokens.show', params: { token: sampleToken } }">
          Token (uuid)
        </router-link>
        <router-link :to="{ name: 'plans.show', params: { plan: 'pro' } }"
          >Plan (whereIn)</router-link
        >
        <router-link :to="welcomeUrl">Welcome (defaults → {{ welcomeUrl }})</router-link>

        <div class="nav-group">Resources</div>
        <router-link :to="{ name: 'posts.index' }">Posts (resource)</router-link>
        <router-link :to="{ name: 'users.index' }">Users (binding)</router-link>
        <router-link :to="{ name: 'tags.index' }">Tags (bulk)</router-link>
        <router-link :to="{ name: 'photos.comments.show', params: { photo: 1, comment: 5 } }">
          Photo comment (nested)
        </router-link>

        <div class="nav-group">Bindings &amp; middleware</div>
        <router-link :to="{ name: 'profile.show' }">Profile (singleton)</router-link>
        <router-link :to="{ name: 'articles.show', params: { user: 1, article: 'hello-world' } }">
          Scoped article
        </router-link>
        <router-link :to="{ name: 'status' }">Status (withoutMiddleware)</router-link>

        <div class="nav-group">Nested layout</div>
        <router-link :to="{ name: 'settings.profile' }">Settings</router-link>

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
          current route: <b>{{ routeName ?? '' }}</b> · section (useIsRoute): <b>{{ section }}</b>
        </span>
        <button @click="onLogout">Log out</button>
      </div>

      <router-view />
    </main>
  </div>
</template>
