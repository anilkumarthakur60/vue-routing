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
`adminXexampleXcom`). Matching is **case-insensitive**, like DNS.

## How it is enforced

Domains are resolved at **router-creation time**. [`createAppRouter`](/api/#createapprouter-options)
compares each record's `domain` against the effective hostname — the
`hostname` option if given, else `window.location.hostname` — and drops the
records that don't match before handing the tree to vue-router. The hostname
is fixed for a page load, so each host sees exactly its own routes.

```ts
// On https://acme.example.com → /dashboard resolves.
// On https://evil.com        → /dashboard does not exist (404 / fallback).
```

Because filtering happens per host, the **same path registered under two
domains** works — Laravel's canonical multi-tenant pattern:

```ts
Route.domain('app.example.com').group(() => {
  Route.view('dash', AppDashboard).name('dash.app')
})
Route.domain('admin.example.com').group(() => {
  Route.view('dash', AdminDashboard).name('dash.admin')
})
// Each host matches its own /dash record.
```

The navigation guard still validates `meta.domain` on every matched route as a
safety net (navigation is cancelled on a mismatch — relevant if you build the
router yourself with unfiltered records).

## SSR

There is no `window` on the server — pass the incoming request's `Host` header
as `hostname` so domain filtering and validation work per request:

```ts
const router = createAppRouter({
  routes: Route.getRoutes(),
  historyMode: 'memory',
  hostname: req.headers.host?.replace(/:\d+$/, ''),
})
```

Without a hostname, domain filtering and validation are **skipped entirely**:
every domain-bound record stays in the tree and navigations are allowed. Pair
this with [`createRouteFacade()`](/guide/getting-started#ssr-hmr-isolated-facades)
for per-request registries.

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

## Generating URLs across domains

`Route.route()` fills domain params into the **host** and returns a
protocol-relative URL when it can — see
[URLs for domain-bound routes](/guide/url-generation#urls-for-domain-bound-routes).
