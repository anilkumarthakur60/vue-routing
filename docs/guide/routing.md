# Defining Routes

Routes are declared on the `Route` facade. Each definition method registers a
record and returns a chainable [`RouteDefinition`](/api/#routedefinition).

## Basic routes

```ts
Route.get('about', AboutPage).name('about')
```

`get` registers a navigable route. The first argument is the URI, the second the
component — either eager or a lazy `() => import('...')` loader:

```ts
Route.get('about', () => import('@/pages/About.vue')).name('about')
```

By default the record is created with `props: true`, so route params are passed
to the component as props.

## View routes

`view` is `get` plus optional **static** props. Use it for pages that take fixed
configuration rather than route params:

```ts
Route.view('about', AboutPage, { version: '1.0.0' }).name('about')
```

```ts
defineProps<{ version?: string }>() // inside AboutPage
```

## Redirects

```ts
Route.redirect('here', '/there') // 302 (default)
Route.redirect('here', '/there', 301) // explicit status
Route.permanentRedirect('home', '/dashboard') // 301
```

A common pattern is redirecting the index of a section to its default child:

```ts
Route.redirect('settings', '/settings/profile')
```

## Fallback (404)

```ts
Route.fallback(NotFoundPage)
```

This matches `/:pathMatch(.*)*` and is registered under the name `NotFound`, so
`Route.has('NotFound')` is `true` and you can navigate to it programmatically.

## Route parameters

Both Laravel `{param}` and vue-router `:param` syntaxes work and interoperate —
use whichever you prefer.

```ts
Route.get('users/{id}', UserPage).name('users.show') // required
Route.get('user/{name?}', UserPage).name('user') // optional
Route.get('posts/{post:slug}', PostPage).name('posts.show') // custom key
Route.get('posts/{post:slug?}', PostPage).name('posts.show') // optional custom key
```

- `{param}` → a required segment.
- `{param?}` → optional.
- `{param:column}` → a [custom binding key](/guide/model-binding#custom-keys);
  the `column` is handed to your resolver, the URL segment stays `:param`.

Constrain parameters with regex via `.where()` and the `whereX` helpers — see
[Parameters & Constraints](/guide/constraints).

## Inspecting registered routes

```ts
Route.toList() // → [{ path, name, middleware }, ...]
Route.toList('/admin') // filtered by path prefix
Route.list() // console.table(...) for quick debugging
```

`Route.getRoutes()` returns the assembled `RouteRecordRaw[]` to hand to
[`createAppRouter`](/api/#createapprouter-options).
