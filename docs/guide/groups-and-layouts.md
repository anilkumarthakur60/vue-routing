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
