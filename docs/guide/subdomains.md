# Subdomains

Constrain a group of routes to a subdomain pattern with `domain()`, and read the
captured subdomain parameters reactively (Laravel's subdomain routing).

## Declaring a domain

```ts
Route.domain('{account}.example.com').group(() => {
  Route.view('dashboard', DashboardPage).name('dashboard')
})
```

Each `{param}` matches a single subdomain label (`[^.]+`); the rest of the host
is matched literally (dots are escaped, so `admin.example.com` does not match
`adminXexampleXcom`).

## How it is enforced

The navigation guard installed by [`createAppRouter`](/api/#createapprouter-options)
checks every matched route's `domain` against the current `window.location.hostname`
before entering. If the host does not satisfy the pattern, navigation is
**cancelled**.

```ts
// On https://acme.example.com → /dashboard resolves.
// On https://evil.com        → navigation to /dashboard is cancelled.
```

On the server / during SSR (`window` undefined) the check is skipped.

## Reading subdomain params

Use `useSubdomainParams()` inside a component to read the captured labels:

```vue
<script setup lang="ts">
import { useSubdomainParams } from '@anil-labs/vue-routing'

// Route.domain('{account}.example.com')
const subdomain = useSubdomainParams() // ComputedRef<{ account: string }>
</script>

<template>
  <p>Account: {{ subdomain.account }}</p>
</template>
```

It returns `{}` when the current route declares no `domain`, or when running
without a `window`.
