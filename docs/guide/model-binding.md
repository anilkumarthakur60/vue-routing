# Model Binding

Resolve a route parameter to a full model **before** the page renders  the
client-side analogue of Laravel's route-model binding.

::: tip Explicit only
Laravel's _implicit_ (type-hint) binding relies on server reflection and a
database, neither of which exists in the browser. This package supports
**explicit** binding via `Route.bind()` / `Route.model()`.
:::

## Registering a resolver

```ts
import { Route } from '@anil-labs/vue-routing'
import { fetchUser } from '@/api/users'

Route.get('users/{user}', UserPage)
  .name('users.show')
  .missing(() => ({ name: 'users.index' }))

// Resolver for the `{user}` segment. Returning null/undefined → "not found".
Route.bind('user', (value) => fetchUser(value))
```

`Route.model(param, resolver)` is an alias of `Route.bind`.

## Enabling resolution

Pass the bindings to the factory so the guard runs them:

```ts
export default createAppRouter({
  routes,
  bindings: Route.getBindings(),
})
```

During navigation the guard resolves every parameter that has a binding. If a
resolver returns `null`/`undefined`, the route's `missing()` handler runs (or
navigation is cancelled if there is none).

## The resolver

A `BindingResolver` receives the raw segment value, the target route, and a
**context** object  and returns the model (or `null` for "not found"):

```ts
import type { BindingResolver } from '@anil-labs/vue-routing'

const userResolver: BindingResolver = (value, to, ctx) => fetchUser(value)
```

The context is fully client-side  it never touches a database, it just gives
your `fetch` enough information to scope itself:

```ts
interface BindingResolverContext {
  field: string | undefined // custom key from {param:field}
  parent: unknown // nearest resolved parent (when scopeBindings() is on)
  bound: Readonly<Record<string, unknown>> // everything resolved so far
}
```

## Custom keys

`{post:slug}` tells the resolver which column the value refers to. The URL
segment stays `:post`; the column arrives as `ctx.field`:

```ts
Route.get('posts/{post:slug}', PostPage).name('posts.show')

Route.bind('post', (value, _to, { field }) => fetchPost({ [field!]: value }))
// field === 'slug'
```

Custom keys declared in a **group prefix** carry through to every route inside
(the leaf URI wins if both declare a field for the same param):

```ts
Route.prefix('teams/{team:slug}').group(() => {
  Route.get('dashboard', TeamDashboard).name('teams.dashboard')
  // resolver for `team` receives field === 'slug'
})
```

## Scoped bindings

For nested params, `scopeBindings()` resolves **parent → child** and hands the
resolved parent to the child resolver as `ctx.parent`, so the child can scope
its own lookup (Laravel scopes the DB query; here you scope your API call):

```ts
Route.scopeBindings().group(() => {
  Route.get('users/{user}/posts/{post:slug}', PostPage).name('users.posts.show')
})

Route.bind('user', (value) => fetchUser(value))
Route.bind('post', (slug, _to, { parent, field }) => {
  const user = parent as User // already resolved
  return fetchPost(`/users/${user.id}/posts`, { [field!]: slug })
})
```

`withoutScopedBindings()` (on a route or an inner group) opts back out.

## Reading resolved models

Resolved models are attached to the navigation and exposed reactively:

```vue
<script setup lang="ts">
import { useBoundModels } from '@anil-labs/vue-routing'
import type { User } from '@/api/users'

const models = useBoundModels<{ user: User }>()
</script>

<template>
  <h1 v-if="models.user">{{ models.user.name }}</h1>
</template>
```

No fetching in the component  the model is already there.
