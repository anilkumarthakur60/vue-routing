# @anil-labs/vue-routing

Laravel-inspired, fully-typed declarative routing for **Vue 3**  a thin, ergonomic wrapper over [`vue-router`](https://router.vuejs.org/). Define routes with a fluent `Route` facade (groups, layouts, middleware, resources, constraints, named routes, model bindings) and let the package build the `vue-router` tree for you.

```ts
Route.middleware(auth)
  .layout(MainLayout)
  .group(() => {
    Route.redirect('', '/dashboard')
    Route.view('dashboard', () => import('@/pages/Dashboard.vue')).name('dashboard')
    Route.resource('users', UsersPage).only('index', 'show')
  })
```

## Repository structure

This is a pnpm workspace monorepo:

| Path                                             | What it is                                        |
| ------------------------------------------------ | ------------------------------------------------- |
| [`packages/vue-routing`](./packages/vue-routing) | The published library  `@anil-labs/vue-routing`. |
| [`examples/demo`](./examples/demo)               | Interactive demo SPA exercising every feature.    |
| [`docs`](./docs)                                 | The VitePress documentation site.                 |

## Install

```bash
npm i @anil-labs/vue-routing
```

`vue` (^3.5) and `vue-router` (^4.5 or ^5) are **peer dependencies**  provide them in your app.

## Quick start

**`router/web.ts`**  declare routes:

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

**`router/index.ts`**  create the router:

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
> navigation. There are no `post`/`put`/`delete` verbs  those are server
> concerns. The only verb is `get` (plus `view`, `redirect`, `fallback`,
> `resource`).

## SSR: `createRouteFacade()`

The shared `Route` singleton holds registration state at module scope  ideal
for an SPA, wrong for anything that evaluates your routes module more than
once against a cached copy of the library (Vite SSR dev, HMR boundaries,
per-request SSR, cross-file tests). For those, create an **isolated facade**
per router:

```ts
import { createRouteFacade, createAppRouter } from '@anil-labs/vue-routing'

export function buildRouter(hostname?: string) {
  const Route = createRouteFacade() // fresh registry, no shared state
  Route.get('/', Home).name('home')

  return createAppRouter({
    routes: Route.getRoutes(),
    historyMode: 'memory',
    hostname, // pass the request's Host header  enables domain() routing in SSR
  })
}
```

The singleton is also forgiving now: re-registering the identical (name, path)
pair replaces the entry with a dev-time warning instead of throwing, so an
HMR-triggered re-evaluation survives.

## Features

| Capability        | API                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Routes            | `Route.get(uri, component)`, `Route.view(uri, component, props?)`                                             |
| Redirects         | `Route.redirect(from, to, status?)` (shared `{param}`s substituted), `Route.permanentRedirect`                |
| Named routes      | `.name('x')` / `.as('x')`, plus group `name()`/`asPrefix()` prefixes                                          |
| Groups            | `Route.middleware(...).prefix(...).group(cb)`  attributes merge, never replace                               |
| Layouts (nested)  | `Route.layout(Comp).group(cb)`  wraps routes in `<router-view>` parents                                      |
| Middleware        | per-route `.middleware(...)` / `.withoutMiddleware(...)`, group-level, auto-merged                            |
| Param constraints | `.where({...})`, `.whereNumber/whereAlpha/whereAlphaNumeric/whereUuid/whereUlid/whereIn(...)`                 |
| Global patterns   | `Route.pattern(name, regex)` / `Route.patterns({...})`  order-independent                                    |
| Resources         | `Route.resource(name, comp)` → navigable `index`/`create`/`show`/`edit`, fluent `.only()`, `.middleware()`, … |
| Model bindings    | `Route.bind(param, resolver)` / `Route.model(...)` + `.missing(handler)`                                      |
| Subdomains        | `Route.domain('{account}.example.com').group(cb)`  per-host route matching                                   |
| URL generation    | `Route.route(name, params?)` → string (domain params fill the host)                                           |
| Inspection        | `Route.has(name)`, `Route.toList()`, `Route.list()`                                                           |

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

> Laravel's _implicit_ (type-hint) binding can't exist client-side  there's no
> reflection or DB. Use explicit `Route.bind()` / `Route.model()` resolvers.

### Composables

`useRouteName()`, `useRouteAction()`, `useIsRoute(name)`, `useBoundModels<T>()`, `useSubdomainParams()`  all reactive; call within `setup()`.

## Type safety

Written in strict TypeScript with **zero `any`**. The package augments
`vue-router`'s `RouteMeta`, so `to.meta.middleware`, `to.meta.bound`, etc. are
typed everywhere  in this package and in your app.

## Not applicable in an SPA

These Laravel routing features are server-side concerns and are intentionally
**not** implemented: HTTP verbs other than GET, CSRF, form-method spoofing, rate
limiting, route caching, CORS, and controller dispatch (your component _is_ the
handler).

## Demo

A full interactive demo lives in [`examples/demo/`](./examples/demo) and
exercises every feature  layouts, middleware (auth/guest/log), redirects,
optional & constrained params, resources, model binding with `missing()`, URL
generation, the route table, and 404. It imports the package by its published
name (aliased to the workspace source, so library changes hot-reload).

```bash
pnpm install
pnpm dev                                # run the demo locally
pnpm --filter example-demo build        # build the demo SPA
pnpm --filter example-demo preview      # preview the production build
```

## Documentation

Full docs are built with VitePress in [`docs/`](./docs):

```bash
pnpm docs:dev      # serve docs locally
pnpm docs:build    # build static docs
pnpm docs:preview  # preview the built docs
```

## Development

```bash
pnpm install       # bootstrap the workspace
pnpm dev           # run the demo app (examples/demo)
pnpm test          # vitest across packages
pnpm typecheck     # tsc/vue-tsc across the workspace
pnpm build         # bundle + .d.ts for each package
pnpm lint          # eslint
pnpm format        # prettier --write
pnpm check         # lint + format:check + typecheck + test
```

## Continuous integration & releases

GitHub Actions workflows live in [`.github/workflows`](./.github/workflows):

| Workflow                                                | Trigger                 | What it does                                                                                                                                          |
| ------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI** (`ci.yml`)                                       | push to `main`, PRs     | install, build, lint, format check, typecheck, test, build examples                                                                                   |
| **Release** (`release.yml`)                             | push to `main`          | [Changesets](https://github.com/changesets/changesets): opens/updates the "Version Packages" PR and publishes to npm (with provenance) when it merges |
| **Docs** (`docs.yml`)                                   | push touching `docs/**` | build VitePress and deploy to GitHub Pages                                                                                                            |
| **Dependabot auto-merge** (`dependabot-auto-merge.yml`) | Dependabot PRs          | approve + auto-merge patch/minor bumps (majors stay manual)                                                                                           |

To release: add a changeset (`pnpm changeset`) alongside your change; the
Release workflow versions and publishes when the "Version Packages" PR merges.
Publishing requires the **`NPM_TOKEN`** repo secret; GitHub Pages needs
Settings → Pages → Source: **GitHub Actions** (one-time setup).

## License

MIT
