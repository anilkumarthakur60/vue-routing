# Parameters & Constraints

Constrain route parameters with regular expressions, at the route, group, or
global level. Constraints are compiled into the vue-router path (e.g.
`:id([0-9]+)`) — the clean `:id` form is kept for [URL generation](/guide/url-generation).

## Per-route constraints

Raw regex via `.where()`:

```ts
Route.get('users/{id}', UserPage).where({ id: '[0-9]+' }).name('users.show')
```

### Convenience helpers

| Helper                         | Pattern                       |
| ------------------------------ | ----------------------------- |
| `whereNumber(...params)`       | `[0-9]+`                      |
| `whereAlpha(...params)`        | `[A-Za-z]+`                   |
| `whereAlphaNumeric(...params)` | `[A-Za-z0-9]+`                |
| `whereUuid(...params)`         | a UUID                        |
| `whereUlid(...params)`         | a ULID                        |
| `whereIn(param, values)`       | the values, matched literally |

```ts
Route.get('users/{id}', UserPage).whereNumber('id')
Route.get('users/{name}', UserPage).whereAlpha('name')
Route.get('tokens/{token}', TokenPage).whereUuid('token')
Route.get('plans/{plan}', PlanPage).whereIn('plan', ['free', 'pro', 'team'])
```

`whereIn` values are regex-escaped, so they always match **literally** —
`whereIn('file', ['a.b', 'txt'])` matches `a.b` and `txt`, never `axb`.

Each `whereX` accepts multiple parameter names:

```ts
Route.get('{from}/{to}', Page).whereAlpha('from', 'to')
```

## Group-level constraints

The same helpers exist on the group builder and apply to every route inside:

```ts
Route.whereNumber('id').group(() => {
  Route.get('users/{id}', UserPage).name('users.show')
  Route.get('posts/{id}', PostPage).name('posts.show')
})
```

## Global patterns

Apply a constraint to **every** matching parameter name across the app
(Laravel's `Route::pattern`):

```ts
Route.pattern('id', '[0-9]+')
Route.patterns({ id: '[0-9]+', slug: '[a-z0-9-]+' })
```

Now any `{id}` segment is digit-constrained unless a more specific constraint is
given on the route or its group.

Global patterns are applied **lazily**, when the routes are exported
(`getRoutes()` / `toList()`), so declaration order does not matter — a
`pattern()` defined after a route still constrains it, just like Laravel's
`Route::pattern` in a service provider.

## Precedence

When the same parameter is constrained in more than one place:

- A constraint given at **registration** (route `.where()` / group `whereX`)
  wins over a global pattern, regardless of the order they were declared in.
- An **inline regex** you write yourself (`:id(\\d+)`) is never overwritten.
- Repeated `.where()` calls on the same parameter are **last-write-wins** — the
  final constraint is what both the path and `meta.where` carry.

```ts
Route.pattern('id', '[0-9]+')

Route.where({ id: '[A-Z]+' }).group(() => {
  Route.get('codes/{id}', Page).name('codes.show') // → /codes/:id([A-Z]+)
})
```
