# Model Binding

Resolve a route parameter to a full model **before** the page renders — the
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

No fetching in the component — the model is already there.
