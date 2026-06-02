# Named Routes & URLs

## Naming routes

Give a route a name with `.name()` (or its alias `.as()`). Names must be unique —
registering a duplicate throws.

```ts
Route.get('users/{id}/profile', ProfilePage).name('users.profile')
Route.get('about', AboutPage).as('about') // alias of name()
```

Group name prefixes are appended with a `.` separator — see
[Groups & Layouts](/guide/groups-and-layouts#name-prefixes).

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

- A missing **required** param throws:

  ```ts
  Route.route('users.profile') // throws: Missing required parameter "id"
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

::: tip
`defaults()` affects `Route.route()` URL generation. For `<router-link :to="{ name }">`
navigation, vue-router resolves params itself — pass the value, or generate the
path with `Route.route()`.
:::

## Existence checks

```ts
Route.has('users.profile') // → true
Route.has('nope') // → false
```
