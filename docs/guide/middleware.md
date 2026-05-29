# Middleware

Middleware are functions that run before a route is entered. They use
vue-router's return-value style — **no `next()` callback**.

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

```ts
Route.middleware(auth).group(() => {
  Route.get('public', PublicPage).withoutMiddleware(auth)
})
```

## Execution model

The navigation guard built by `createAppRouter`:

1. collects middleware from **all matched records** (layouts + page), in order;
2. removes anything excluded via `withoutMiddleware()`;
3. de-duplicates (a middleware shared by a layout and a child runs once);
4. runs them sequentially — the **first** non-`true` result wins (redirect or
   cancel).

Because layout-level middleware lives on the matched layout record, it runs even
when the child route declares none of its own.
