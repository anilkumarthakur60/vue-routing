# @anil-labs/vue-routing

Laravel-inspired, fully-typed declarative routing for **Vue 3** — a thin, ergonomic wrapper over [`vue-router`](https://router.vuejs.org/). Define routes with a fluent `Route` facade (groups, layouts, middleware, resources, constraints, named routes, model bindings) and let the package build the `vue-router` tree for you.

```ts
Route.middleware(auth)
  .layout(MainLayout)
  .group(() => {
    Route.redirect('', '/dashboard')
    Route.view('dashboard', () => import('@/pages/Dashboard.vue')).name('dashboard')
    Route.resource('users', UsersPage, { only: ['index', 'show'] })
  })
```

## Install

```bash
npm i @anil-labs/vue-routing
```

`vue` (^3.5) and `vue-router` (^4.5) are **peer dependencies** — provide them in your app.

## Quick start

**`router/web.ts`** — declare routes:

```ts
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
      })
  })

Route.fallback(() => import('@/pages/NotFound.vue'))

export default Route.getRoutes()
```

**`router/index.ts`** — create the router:

```ts
import { createAppRouter, Route } from '@anil-labs/vue-routing'
import routes from './web'

export default createAppRouter({
  routes,
  historyMode: 'history', // 'history' | 'hash' | 'memory'
  bindings: Route.getBindings(), // optional: enable model bindings
})
```

> **GET-only.** This is a client-side router: every route is reached by
> navigation. There are no `post`/`put`/`delete` verbs — those are server
> concerns. The only verb is `get` (plus `view`, `redirect`, `fallback`,
> `resource`).

## Features

| Capability        | API                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Routes            | `Route.get(uri, component)`, `Route.view(uri, component, props?)`                             |
| Redirects         | `Route.redirect(from, to, status?)`, `Route.permanentRedirect(from, to)`                      |
| Named routes      | `.name('x')` / `.as('x')`, plus group `name()`/`asPrefix()` prefixes                          |
| Groups            | `Route.middleware(...).prefix(...).group(cb)`                                                 |
| Layouts (nested)  | `Route.layout(Comp).group(cb)` — wraps routes in `<router-view>` parents                      |
| Middleware        | per-route `.middleware(...)` / `.withoutMiddleware(...)`, group-level, auto-merged            |
| Param constraints | `.where({...})`, `.whereNumber/whereAlpha/whereAlphaNumeric/whereUuid/whereUlid/whereIn(...)` |
| Global patterns   | `Route.pattern(name, regex)` / `Route.patterns({...})`                                        |
| Resources         | `Route.resource(name, comp, opts?)` → navigable `index`/`create`/`show`/`edit` only           |
| Model bindings    | `Route.bind(param, resolver)` / `Route.model(...)` + `.missing(handler)`                      |
| Subdomains        | `Route.domain('{account}.example.com').group(cb)`                                             |
| URL generation    | `Route.route(name, params?)` → string                                                         |
| Inspection        | `Route.has(name)`, `Route.toList()`, `Route.list()`                                           |

### Laravel-style parameters

Both `{param}` and `vue-router` `:param` syntaxes work and interoperate:

```ts
Route.get('users/{id}', UserPage).whereNumber('id').name('users.show')
Route.get('user/{name?}', UserPage).name('user') // optional
Route.get('posts/{post:slug}', PostPage).name('posts.show') // custom key
```

### Model bindings

```ts
Route.get('users/{user}', UserPage)
  .name('users.show')
  .missing(() => ({ name: 'users.index' }))

Route.bind('user', (value) => fetchUser(value)) // return null ⇒ triggers missing()
```

Resolved models are exposed in components via the `useBoundModels` composable:

```ts
import { useBoundModels } from '@anil-labs/vue-routing'
const models = useBoundModels<{ user: User }>()
// models.value.user
```

> Laravel's _implicit_ (type-hint) binding can't exist client-side — there's no
> reflection or DB. Use explicit `Route.bind()` / `Route.model()` resolvers.

### Composables

`useRouteName()`, `useIsRoute(name)`, `useBoundModels<T>()`, `useSubdomainParams()` — all reactive; call within `setup()`.

## Type safety

Written in strict TypeScript with **zero `any`**. The package augments
`vue-router`'s `RouteMeta`, so `to.meta.middleware`, `to.meta.bound`, etc. are
typed everywhere — in this package and in your app.

## Not applicable in an SPA

These Laravel routing features are server-side concerns and are intentionally
**not** implemented: HTTP verbs other than GET, CSRF, form-method spoofing, rate
limiting, route caching, CORS, and controller dispatch (your component _is_ the
handler).

## Demo

A full interactive demo lives in [`demo/`](./demo) and exercises every feature —
layouts, middleware (auth/guest/log), redirects, optional & constrained params,
resources, model binding with `missing()`, URL generation, the route table, and 404. It imports the package by its published name.

```bash
npm run dev           # run the demo locally
npm run build:demo    # build the demo SPA into demo-dist/
npm run preview:demo  # preview the production build
```

### Deploy the demo to Vercel

The repo includes [`vercel.json`](./vercel.json), which points Vercel at the demo
build and adds the SPA fallback rewrite (required for vue-router history mode):

```json
{
  "buildCommand": "npm run build:demo",
  "outputDirectory": "demo-dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- **Dashboard:** import the repo at [vercel.com/new](https://vercel.com/new) — it
  auto-detects `vercel.json`, so no manual settings are needed.
- **CLI:** `npm i -g vercel && vercel` (then `vercel --prod`).

> The default `npm run build` is the **library** build (for npm publishing). The
> demo uses a separate config (`vite.demo.config.ts`), so the two never collide.

## Documentation

Full docs are built with VitePress in [`docs/`](./docs):

```bash
npm run docs:dev      # serve docs locally
npm run docs:build    # build static docs
```

## Development

```bash
npm run dev           # run the demo app (demo/)
npm test              # vitest (tests/)
npm run typecheck     # vue-tsc
npm run build         # bundle + .d.ts into dist/
npm run lint          # eslint
npm run format        # prettier --write
npm run format:check  # prettier --check
```

## License

MIT
