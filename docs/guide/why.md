# Why vue-routing

`@anil-labs/vue-routing` is a thin, fully-typed wrapper over
[vue-router](https://router.vuejs.org/). It does not replace vue-router  it
**builds the `RouteRecordRaw[]` tree for you** from a fluent, Laravel-style API,
and wires a single navigation guard for middleware, subdomains, and model
binding.

## The problem it solves

A hand-written vue-router config grows awkward fast: repeated path prefixes,
deeply nested `children` arrays for layouts, middleware logic scattered across
`beforeEach`, and stringly-typed `meta`. Laravel solved the same problem on the
server with route groups, resource controllers, named routes, and route-model
binding. This package brings that ergonomics to the client.

```ts
// Instead of nesting `children` arrays by hand…
Route.middleware(auth)
  .layout(MainLayout)
  .group(() => {
    Route.view('dashboard', Dashboard).name('dashboard')
    Route.resource('posts', PostsPage)
  })
```

## What it is

- A **fluent builder** (`Route`) that accumulates groups, prefixes, names,
  middleware, layouts, and constraints, then emits a vue-router tree.
- A **factory** (`createAppRouter`) that creates the router and installs one
  `beforeEach` guard handling subdomains → middleware → model binding.
- **Composables** for reading routing state reactively in components.
- **Strict types** that augment vue-router's `RouteMeta`, so `to.meta.middleware`,
  `to.meta.bound`, etc. are typed everywhere  in this package and in your app.

## What it is not

This is a **client-side** router for single-page apps. Every route is reached by
navigation, so the only verb is `get` (plus `view`, `redirect`, `fallback`,
`resource`, and `singleton`).

These Laravel features are server/database concerns and are intentionally **not**
implemented:

| Not included                              | Why                                             |
| ----------------------------------------- | ----------------------------------------------- |
| `post` / `put` / `patch` / `delete` verbs | HTTP methods are a server concern               |
| Implicit (reflection) model binding       | No server reflection or database in the browser |
| `withTrashed`, Eloquent scoping queries   | Database concepts                               |
| CSRF, rate limiting, route caching        | Server middleware                               |
| Controllers / namespaces                  | Your component _is_ the handler                 |

Model binding still exists  but as **explicit** resolvers (`Route.bind()`) that
call your own API, never a database. See [Model Binding](/guide/model-binding).

## Relationship to vue-router

You keep using vue-router directly for everything else: `<router-view>`,
`<router-link>`, `useRoute`, `useRouter`, navigation methods, scroll behavior,
and so on. This package only owns **route definition** and the **guard wiring**.
