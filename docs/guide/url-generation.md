# Named Routes & URLs

## Naming routes

Give a route a name with `.name()` (or its alias `.as()`). Names must be
unique  registering the same name for a **different path** throws.

```ts
Route.get('users/{id}/profile', ProfilePage).name('users.profile')
Route.get('about', AboutPage).as('about') // alias of name()
```

Group name prefixes are appended with a `.` separator  see
[Groups & Layouts](/guide/groups-and-layouts#name-prefixes).

Two edge cases behave sensibly:

- **Renaming**  calling `.name()` again on the same definition unregisters the
  previous name, so no stale alias lingers in the registry.
- **Re-registration**  registering the identical (name, path) pair again
  replaces the entry with a dev-time warning instead of throwing, so a routes
  module re-evaluated by Vite SSR dev or HMR is survivable. See
  [Getting Started](/guide/getting-started#ssr-hmr-isolated-facades) for
  isolated facades.

## Generating URLs

`Route.route(name, params?)` builds a URL string from a named route, Laravel's
`route()` helper:

```ts
Route.route('users.profile', { id: 1 }) // → '/users/1/profile'
```

- Extra params become a **query string**:

  ```ts
  Route.route('users.profile', { id: 1, tab: 'security' })
  // → '/users/1/profile?tab=security'
  ```

- Values are URL-encoded:

  ```ts
  Route.route('search', { q: 'a b', tag: 'c&d' }) // → '/search/a%20b?tag=c%26d'
  ```

- Optional params are dropped when omitted, and inline regex constraints are
  stripped:

  ```ts
  Route.route('docs') // '/docs'  (from 'docs/{slug?}')
  Route.route('docs', { slug: 'intro' }) // '/docs/intro'
  ```

- A missing **required** param throws  and so does an empty one (`''` / `[]`),
  because silently generating a shorter, wrong URL would hide the bug at the
  call site (Laravel throws an `UrlGenerationException` too):

  ```ts
  Route.route('users.profile') // throws: Missing required parameter "id"
  Route.route('users.profile', { id: '' }) // throws: must not be empty
  ```

### Wildcard & repeatable params

Catch-all and repeatable params (`:path*` / `:path+`, including the fallback's
`/:pathMatch(.*)*`) generate too. Pass an array (one path segment per element)
or a pre-joined string  each segment is encoded individually, so the `/`
separators survive:

```ts
Route.fallback(NotFoundPage)

Route.route('NotFound') // → '/'      (zero-or-more may be omitted)
Route.route('NotFound', { pathMatch: 'a b/c' }) // → '/a%20b/c'
Route.route('NotFound', { pathMatch: ['a b', 'c'] }) // → '/a%20b/c'
```

### Use with `<router-link>`

`Route.route()` returns a plain path string, so it composes with vue-router:

```vue
<router-link :to="Route.route('users.profile', { id: user.id })">Profile</router-link>
```

For name-based navigation you can also use vue-router directly:
`router.push({ name: 'users.profile', params: { id } })`.

## Default parameter values

`.defaults()` supplies fallback values used during URL generation when a param
is not passed (Laravel's `->defaults()`). Handy for things like a locale prefix:

```ts
Route.get('{locale}/about', AboutPage).defaults('locale', 'en').name('about')

Route.route('about') // → '/en/about'
Route.route('about', { locale: 'fr' }) // → '/fr/about'
```

It accepts a single pair or a map, and merges across calls:

```ts
Route.get('{a}/{b}/x', Page).defaults({ a: '1' }).defaults('b', '2').name('x')
Route.route('x') // → '/1/2/x'
```

Defaults only fill **path** params (and [domain params](#urls-for-domain-bound-routes)).
A default for a param the path does not use never leaks into the query string.

::: tip
`defaults()` affects `Route.route()` URL generation. For `<router-link :to="{ name }">`
navigation, vue-router resolves params itself  pass the value, or generate the
path with `Route.route()`.
:::

## URLs for domain-bound routes

For a route registered under a [`domain()`](/guide/subdomains) pattern, params
that belong to the domain go into the **host**, never the query string. When
every domain param can be resolved (from your params or the route's
`defaults()`), `Route.route()` returns a protocol-relative absolute URL:

```ts
Route.domain('{account}.example.com').group(() => {
  Route.get('dash', DashboardPage).name('dash')
})

Route.route('dash', { account: 'acme' }) // → '//acme.example.com/dash'
Route.route('dash') // → '/dash' (relative fallback)
```

A static domain (no params) stays relative, and a param used by both the
domain and the path fills both places.

## Existence checks

```ts
Route.has('users.profile') // → true
Route.has('nope') // → false
```
