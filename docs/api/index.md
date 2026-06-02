# API Reference

## `Route`

The singleton facade (an instance of `Router`). Also the package's default
export.

### Attribute builders

Each returns a `RouteRegistrar` for chaining into `.group()` or a route.

| Method                       | Description                         |
| ---------------------------- | ----------------------------------- |
| `middleware(...fns)`         | Attach middleware to the group.     |
| `prefix(uri)`                | Prefix every URI in the group.      |
| `name(prefix)` / `asPrefix`  | Prefix every route name.            |
| `domain(pattern)`            | Constrain the subdomain.            |
| `layout(component)`          | Wrap the group in a layout.         |
| `component(component)`       | Alias of `layout`.                  |
| `where(map)`                 | Group-wide regex constraints.       |
| `whereNumber/whereAlpha/...` | Convenience constraints.            |
| `scopeBindings()`            | Scope child bindings to the parent. |
| `withoutScopedBindings()`    | Disable scoped child bindings.      |

### Route definitions

Each returns a `RouteDefinition`.

| Method                             | Description                         |
| ---------------------------------- | ----------------------------------- |
| `get(uri, component)`              | A navigable route.                  |
| `view(uri, component, props?)`     | A route with optional static props. |
| `redirect(from, to, status = 302)` | A redirect.                         |
| `permanentRedirect(from, to)`      | A 301 redirect.                     |
| `fallback(component)`              | The 404 route.                      |
| `resource(name, component, opts?)` | index/create/show/edit routes.      |

### Group opener

- `group(cb)` — open a group using the accumulated attributes.
- `group(options, cb)` — merge extra `GroupAttributes`, then open.

### Patterns & bindings

| Method                   | Description                             |
| ------------------------ | --------------------------------------- |
| `pattern(name, regex)`   | Global constraint for a parameter name. |
| `patterns(map)`          | Several global constraints.             |
| `bind(param, resolver)`  | Explicit model binding resolver.        |
| `model(param, resolver)` | Alias of `bind`.                        |
| `getBindings()`          | The bindings map for `createAppRouter`. |

### Inspection & export

| Method                 | Returns                                   |
| ---------------------- | ----------------------------------------- |
| `getRoutes()`          | `RouteRecordRaw[]` for `createAppRouter`. |
| `route(name, params?)` | A generated URL string.                   |
| `has(name)`            | Whether a named route exists.             |
| `toList(filter?)`      | `{ path, name, middleware }[]`.           |
| `list({ path? })`      | `console.table` of the routes.            |
| `flush()`              | Reset all state (tests).                  |

## `RouteDefinition`

Returned by route-definition methods; chainable.

`name(v)` · `as(v)` · `middleware(...fns)` · `withoutMiddleware(...fns)` ·
`where(map)` · `whereNumber/whereAlpha/whereAlphaNumeric/whereUuid/whereUlid(...params)` ·
`whereIn(param, values)` · `missing(handler)` · `scopeBindings()` ·
`withoutScopedBindings()` · `record` (the underlying `RouteRecordRaw`).

## `createAppRouter(options)`

Builds a configured vue-router instance with the navigation guard wired in.

```ts
interface CreateAppRouterOptions {
  routes: RouteRecordRaw[]
  historyMode?: 'history' | 'hash' | 'memory' // default 'history'
  base?: string
  scrollBehavior?: Router['options']['scrollBehavior']
  bindings?: Map<string, BindingResolver>
}
```

The guard runs, in order: subdomain checks → middleware pipeline → model-binding
resolution (with `missing()` fallback).

## Composables

`useRouteName()` · `useIsRoute(name)` · `useBoundModels<T>()` ·
`useSubdomainParams()` — see [Composables](/guide/composables).

## Types

`RouteComponent` · `MiddlewareFn` · `GuardResult` · `MissingHandler` ·
`BindingResolver<T>` · `AppRouteMeta` · `GroupAttributes` · `ResolvedContext` ·
`ResourceOptions` · `HistoryMode` · `CreateAppRouterOptions` · `NamedRouteEntry`
· `RegisteredRoute` · `RouteDefinitionHost`.

### Meta augmentation

The package augments vue-router's `RouteMeta` with `AppRouteMeta`, so
`to.meta.middleware`, `to.meta.bound`, `to.meta.isView`, etc. are typed in your
app without any setup.

## Tree-shakeable utilities

Pure helpers are exported too: `joinPaths`, `ensureLeadingSlash`,
`collapseSlashes`, `convertLaravelParams`, `extractParamNames`,
`extractBindingFields`, `compileUrl`, `applyWhereConstraints`, `patterns`,
`appendRouteName`, `splitWords`, `pluralize`, `collectMiddleware`,
`runMiddleware`, `createNavigationGuard`.
