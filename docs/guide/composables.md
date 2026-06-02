# Composables

Reactive helpers for reading routing state inside components. All must be called
from within `setup()` (they build on vue-router's `useRoute`).

## `useRouteName()`

The current route's name, reactive.

```vue
<script setup lang="ts">
import { useRouteName } from '@anil-labs/vue-routing'
const name = useRouteName() // ComputedRef<string | undefined>
</script>

<template>
  <span>Current: {{ name }}</span>
</template>
```

## `useRouteAction()`

The current route's resourceful action (`index` / `show` / `create` / `edit`)
when it was registered via [`resource()`](/guide/resources) or `singleton()`,
else `undefined` — Laravel's `currentRouteAction()`.

```ts
import { useRouteAction } from '@anil-labs/vue-routing'
const action = useRouteAction() // ComputedRef<string | undefined>
// one component, branching on the action it's serving
```

## `useIsRoute(...patterns)`

A reactive predicate — handy for active nav states. Patterns may use `*` as a
wildcard (Laravel's `routeIs`), and you can pass several:

```ts
import { useIsRoute } from '@anil-labs/vue-routing'

const onDashboard = useIsRoute('dashboard') // exact
const inUsers = useIsRoute('users.*') // wildcard: users.index, users.show, …
const inEither = useIsRoute('posts.*', 'tags.*') // any of several
```

## `useBoundModels<T>()`

The models resolved by [model binding](/guide/model-binding) for the current
navigation.

```ts
import { useBoundModels } from '@anil-labs/vue-routing'
const models = useBoundModels<{ user: User }>()
// models.value.user
```

## `useSubdomainParams()`

Parameters captured from the subdomain when a route declares a `domain` pattern.

```ts
// Route.domain('{account}.example.com').group(...)
import { useSubdomainParams } from '@anil-labs/vue-routing'
const params = useSubdomainParams() // ComputedRef<{ account: string }>
```
