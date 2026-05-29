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

## `useIsRoute(name)`

A reactive predicate — handy for active states.

```ts
import { useIsRoute } from '@anil-labs/vue-routing'
const onDashboard = useIsRoute('dashboard') // ComputedRef<boolean>
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
