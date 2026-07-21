# Groups & Layouts

## Groups

Share attributes — prefix, name prefix, middleware, constraints, domain — across
many routes. Attribute methods are chainable and return a new registrar; call
`.group(cb)` to open the group.

```ts
Route.prefix('admin')
  .asPrefix('admin')
  .group(() => {
    Route.view('users', UsersPage).name('users') // → /admin/users, name "admin.users"
  })
```

Groups nest, and attributes merge intelligently — prefixes and names are
appended, middleware and constraints are combined:

```ts
Route.prefix('admin')
  .name('admin')
  .group(() => {
    Route.prefix('users')
      .name('users')
      .group(() => {
        Route.get('', UsersPage).name('index') // → /admin/users, "admin.users.index"
      })
  })
```

### Name prefixes

`asPrefix('users')` inserts a `.` automatically (`users.index`). If you provide
a trailing dot yourself (Laravel-style), it is respected:

```ts
Route.name('admin.').group(() => {
  Route.get('users', UsersPage).name('users') // → "admin.users"
})
```

`name()` and `asPrefix()` are aliases.

### Options-object form

Instead of chaining, you can pass the group attributes as an object:

```ts
Route.group({ prefix: 'admin', namePrefix: 'admin', middleware: [auth] }, () => {
  Route.view('users', UsersPage).name('users')
})
```

Accepted keys mirror the chainable methods: `prefix`, `namePrefix`, `middleware`,
`excludedMiddleware`, `where`, `domain`, `layout`, `scopeBindings`,
`withoutScopedBindings`, `missing`.

Combining chained attributes with an options object **merges attribute-wise**,
exactly like nesting two groups (Laravel's `RouteGroup::merge`): middleware
concatenates, prefixes and name prefixes are appended, `where` maps are
spread-merged. The options object never replaces what you chained:

```ts
Route.middleware(auth)
  .prefix('admin')
  .group({ prefix: 'reports', middleware: [log] }, () => {
    Route.get('daily', DailyPage).name('daily')
    // → /admin/reports/daily, middleware: [auth, log]
  })
```

### Group callbacks are synchronous

The group's attributes apply only while its callback runs, so an `async`
callback would register everything after its first `await` **outside** the
group. Passing one throws. Await your imports first, then group:

```ts
const AdminPage = await import('@/pages/Admin.vue') // ✓ before the group

Route.prefix('admin').group(() => {
  Route.view('', AdminPage).name('admin')
})
```

Lazy loaders (`() => import('…')`) are unaffected — they are values, not
awaited registrations.

### Available group attributes

| Method                       | Effect                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `prefix(uri)`                | Prefix every URI in the group.                                                              |
| `name(p)` / `asPrefix(p)`    | Prefix every route name.                                                                    |
| `middleware(...fns)`         | Run middleware for every route. ([Middleware](/guide/middleware))                           |
| `withoutMiddleware(...fns)`  | Remove inherited middleware for the group.                                                  |
| `layout(c)` / `component(c)` | Wrap the group in a layout.                                                                 |
| `domain(pattern)`            | Constrain the subdomain. ([Subdomains](/guide/subdomains))                                  |
| `where` / `whereNumber` …    | Group-wide constraints. ([Constraints](/guide/constraints))                                 |
| `scopeBindings()`            | Scope child bindings to the parent. ([Model Binding](/guide/model-binding#scoped-bindings)) |
| `withoutScopedBindings()`    | Disable scoped child bindings.                                                              |
| `missing(handler)`           | Shared missing-model handler for the group.                                                 |

## Layouts

`layout(Component)` wraps a group's routes in a parent route that renders
`<router-view>`. This is how you attach shared chrome (sidebars, headers).

```ts
Route.layout(MainLayout).group(() => {
  Route.view('dashboard', DashboardPage).name('dashboard')
  Route.view('settings', SettingsPage).name('settings')
})
```

Both routes become children of a single `MainLayout` wrapper — the wrapper is
reused for siblings.

### Nested layouts

Layouts nest to any depth:

```ts
Route.layout(MainLayout).group(() => {
  Route.layout(SettingsLayout).group(() => {
    Route.view('settings/profile', ProfilePage).name('settings.profile')
  })
})
```

`MainLayout` and `settings` content render through nested `<router-view>`s.

### Combining with middleware

```ts
Route.middleware(auth)
  .layout(MainLayout)
  .group(() => {
    Route.view('dashboard', DashboardPage).name('dashboard')
  })
```

Group middleware is propagated onto each page record and runs for the whole
group (see [Middleware](/guide/middleware)).
