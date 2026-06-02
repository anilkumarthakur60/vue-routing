# Getting Started

`@anil-labs/vue-routing` is a Laravel-inspired, fully-typed wrapper over
[vue-router](https://router.vuejs.org/). You declare routes with a fluent
`Route` facade and the package assembles the vue-router tree for you.

## Installation

```bash
npm i @anil-labs/vue-routing
```

`vue` (^3.5) and `vue-router` (^4.5) are **peer dependencies** — your app
provides them.

## A client-side router

This is a router for single-page apps. Every route is reached by **navigation**,
so the only verb is `get` (plus `view`, `redirect`, `fallback`, `resource`, and
`singleton`). There are no `post`/`put`/`delete` methods — those are server
concerns. See [Why vue-routing](/guide/why) for the full rationale.

## Define your routes

```ts
// router/web.ts
import { Route } from '@anil-labs/vue-routing'
import MainLayout from '@/layouts/MainLayout.vue'
import auth from '@/middleware/auth'

Route.middleware(auth)
  .layout(MainLayout)
  .group(() => {
    Route.redirect('', '/dashboard')
    Route.view('dashboard', () => import('@/pages/Dashboard.vue')).name('dashboard')

    Route.prefix('users')
      .asPrefix('users')
      .group(() => {
        Route.view('', () => import('@/pages/Users.vue')).name('index')
        Route.get('{user}', () => import('@/pages/UserShow.vue')).name('show')
      })
  })

Route.fallback(() => import('@/pages/NotFound.vue'))

export default Route.getRoutes()
```

## Create the router

```ts
// router/index.ts
import { createAppRouter, Route } from '@anil-labs/vue-routing'
import routes from './web'

export default createAppRouter({
  routes,
  historyMode: 'history', // 'history' | 'hash' | 'memory'
  bindings: Route.getBindings(), // optional: enables model binding
})
```

## Mount it

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

## Try the demo

The repository ships a full interactive demo under `demo/` that exercises every
feature. Run it with:

```bash
npm run dev
```
