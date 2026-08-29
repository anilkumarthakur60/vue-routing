# Getting Started

`@anil-labs/vue-routing` is a Laravel-inspired, fully-typed wrapper over
[vue-router](https://router.vuejs.org/). You declare routes with a fluent
`Route` facade and the package assembles the vue-router tree for you.

## Installation

```bash
npm i @anil-labs/vue-routing
```

`vue` (^3.5) and `vue-router` (^4.5 or ^5) are **peer dependencies**  your
app provides them.

## A client-side router

This is a router for single-page apps. Every route is reached by **navigation**,
so the only verb is `get` (plus `view`, `redirect`, `fallback`, `resource`, and
`singleton`). There are no `post`/`put`/`delete` methods  those are server
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

## SSR, HMR & isolated facades

The shared `Route` singleton is perfect for an SPA. When the module graph can
be evaluated more than once against a cached copy of the library  Vite SSR
dev, HMR boundaries, per-request SSR, tests importing the same routes file 
create an **isolated facade** with `createRouteFacade()` and build your routes
inside an explicit function:

```ts
import { createRouteFacade, createAppRouter } from '@anil-labs/vue-routing'

export function buildRouter(hostname?: string) {
  const Route = createRouteFacade() // fresh registry, no shared state
  Route.get('/', Home).name('home')

  return createAppRouter({
    routes: Route.getRoutes(),
    historyMode: 'memory',
    hostname, // the request's Host header  enables domain() matching in SSR
  })
}
```

Re-registering the **identical** (name, path) pair on the singleton no longer
throws either  it replaces the entry with a dev-time warning, so an
HMR-triggered re-evaluation of a routes module is survivable. A true collision
(same name, different path) still throws.

## Try the demo

The repository ships a full interactive demo under `examples/demo/` that
exercises every feature. From the repo root:

```bash
pnpm install
pnpm dev
```
