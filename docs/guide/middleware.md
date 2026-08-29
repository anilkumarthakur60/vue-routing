# Middleware

Middleware are functions that run before a route is entered. They use
vue-router's return-value style  **no `next()` callback**.

## Writing middleware

```ts
import type { MiddlewareFn } from '@anil-labs/vue-routing'
import { isAuthenticated } from '@/auth'

const auth: MiddlewareFn = (to) => {
  if (isAuthenticated.value) return true // allow
  return { name: 'login', query: { redirect: to.fullPath } } // redirect
}

export default auth
```

A middleware returns:

- `true` / `undefined` → allow navigation
- `false` → cancel navigation
- a route location (`{ name: 'login' }`, `'/login'`) → redirect

## Attaching middleware

Per route:

```ts
Route.get('dashboard', DashboardPage).middleware(auth)
```

Per group (applies to every route inside):

```ts
Route.middleware(auth, verified).group(() => {
  Route.view('dashboard', DashboardPage).name('dashboard')
})
```

## Removing inherited middleware

Drop a specific middleware for a single route:

```ts
Route.middleware(auth).group(() => {
  Route.get('public', PublicPage).withoutMiddleware(auth)
})
```

…or for a whole nested group (the rest of the chain still applies):

```ts
Route.middleware(log, auth).group(() => {
  Route.view('dashboard', DashboardPage).name('dashboard') // log + auth

  Route.withoutMiddleware(auth).group(() => {
    Route.view('status', StatusPage).name('status') // log only
  })
})
```

The exclusion is recorded in route meta (`excludedMiddleware`) and filtered out
of the merged chain, so it works even across nested layouts.

## Execution model

At **registration**, the middleware accumulated by the enclosing group(s) is
merged onto each page record (the layout wrapper records carry none). So a route
inside a `middleware(auth)` group runs `auth` even though it declares no
middleware of its own.

At **navigation**, the single `beforeEach` guard built by `createAppRouter`:

1. collects middleware from every matched record, in order;
2. removes anything excluded via `withoutMiddleware()`;
3. de-duplicates  a middleware applied at both the group and route level runs
   once;
4. runs them sequentially  the **first** non-`true`/non-`undefined` result wins
   (a redirect or cancel short-circuits the rest).
