# API Reference

Everything below is exported from the package root, `@anil-labs/vue-routing`.

## `Route`

The singleton facade (an instance of `Router`), and the package's default export:

```ts
import { Route } from '@anil-labs/vue-routing'
import Route from '@anil-labs/vue-routing' // same instance
```

### Attribute builders

Each returns a `RouteRegistrar` for chaining into `.group()` or a route
definition. See [Groups & Layouts](/guide/groups-and-layouts).

| Method                                                                    | Description                         |
| ------------------------------------------------------------------------- | ----------------------------------- |
| `middleware(...fns)`                                                      | Attach middleware to the group.     |
| `withoutMiddleware(...fns)`                                               | Remove inherited middleware.        |
| `prefix(uri)`                                                             | Prefix every URI in the group.      |
| `name(prefix)` / `asPrefix`                                               | Prefix every route name.            |
| `domain(pattern)`                                                         | Constrain the subdomain.            |
| `layout(component)`                                                       | Wrap the group in a layout.         |
| `component(component)`                                                    | Alias of `layout`.                  |
| `where(map)`                                                              | Group-wide regex constraints.       |
| `whereNumber/whereAlpha/whereAlphaNumeric/whereUuid/whereUlid(...params)` | Built-in constraints.               |
| `whereIn(param, values)`                                                  | Constrain to a fixed set.           |
| `scopeBindings()`                                                         | Scope child bindings to the parent. |
| `withoutScopedBindings()`                                                 | Disable scoped child bindings.      |
| `missing(handler)`                                                        | Shared missing-model handler.       |

### Route definitions

Each returns a `RouteDefinition` (except `resource`/`resources`/`singleton`,
which return the registrar). See [Defining Routes](/guide/routing) and
[Resources](/guide/resources).

| Method                              | Description                          |
| ----------------------------------- | ------------------------------------ |
| `get(uri, component)`               | A navigable route (`props: true`).   |
| `view(uri, component, props?)`      | A route with optional static props.  |
| `redirect(from, to, status = 302)`  | A redirect.                          |
| `permanentRedirect(from, to)`       | A 301 redirect.                      |
| `fallback(component)`               | The 404 route (named `NotFound`).    |
| `resource(name, component, opts?)`  | index/create/show/edit routes.       |
| `resources(map, opts?)`             | Register several resources at once.  |
| `singleton(name, component, opts?)` | show/edit (+ create if `creatable`). |

### Group opener

- `group(cb)` — open a group using the accumulated attributes.
- `group(options, cb)` — merge extra [`GroupAttributes`](#types), then open.

### Patterns & bindings

| Method                   | Description                             |
| ------------------------ | --------------------------------------- |
| `pattern(name, regex)`   | Global constraint for a parameter name. |
| `patterns(map)`          | Several global constraints.             |
| `bind(param, resolver)`  | Explicit model-binding resolver.        |
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
| `flush()`              | Reset all state (useful in tests).        |

## `RouteDefinition`

Returned by route-definition methods; chainable. Wraps the underlying
`RouteRecordRaw` (exposed as `.record`).

| Method                                                                    | Description                            |
| ------------------------------------------------------------------------- | -------------------------------------- |
| `name(v)` / `as(v)`                                                       | Assign a (group-prefixed) unique name. |
| `middleware(...fns)`                                                      | Append per-route middleware.           |
| `withoutMiddleware(...fns)`                                               | Remove inherited middleware.           |
| `where(map)`                                                              | Raw regex constraints.                 |
| `whereNumber/whereAlpha/whereAlphaNumeric/whereUuid/whereUlid(...params)` | Built-in constraints.                  |
| `whereIn(param, values)`                                                  | Constrain to a fixed set.              |
| `missing(handler)`                                                        | Handle an unresolved bound model.      |
| `defaults(key, value)` / `defaults(map)`                                  | Default params for URL generation.     |
| `scopeBindings()`                                                         | Scope child bindings to the parent.    |
| `withoutScopedBindings()`                                                 | Disable scoped child bindings.         |
| `record`                                                                  | The underlying `RouteRecordRaw`.       |

## `createAppRouter(options)`

Builds a configured vue-router instance with the navigation guard wired in.

```ts
interface CreateAppRouterOptions {
  routes: RouteRecordRaw[]
  historyMode?: 'history' | 'hash' | 'memory' // default 'history'
  base?: string // e.g. import.meta.env.BASE_URL
  scrollBehavior?: Router['options']['scrollBehavior'] // default: top-left
  bindings?: Map<string, BindingResolver> // from Route.getBindings()
}
```

The single `beforeEach` guard runs, in order:

1. **Subdomain checks** — validates each matched route's `domain` against the
   current hostname (cancels on mismatch).
2. **Middleware pipeline** — collects, de-duplicates, and runs middleware from
   all matched records; the first redirect/cancel result wins.
3. **Model-binding resolution** — resolves bound params (parent → child) and
   attaches results to `to.meta.bound`, running `missing()` on failure.

## Composables

See [Composables](/guide/composables). All are reactive and must be called in
`setup()`.

| Composable                | Returns                               |
| ------------------------- | ------------------------------------- |
| `useRouteName()`          | `ComputedRef<string \| undefined>`    |
| `useRouteAction()`        | `ComputedRef<string \| undefined>`    |
| `useIsRoute(...patterns)` | `ComputedRef<boolean>` (supports `*`) |
| `useBoundModels<T>()`     | `ComputedRef<Partial<T>>`             |
| `useSubdomainParams()`    | `ComputedRef<Record<string, string>>` |

## Runtime helpers

Lower-level pieces, if you build your own guard:

- `createNavigationGuard(bindings?)` — the `beforeEach` guard used by `createAppRouter`.
- `collectMiddleware(to)` — the ordered, de-duplicated middleware chain for a target.
- `runMiddleware(chain, to, from)` — run a chain; first redirect/cancel wins.

## Constants

| Export                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `RESOURCE_ACTIONS`     | `['index', 'create', 'show', 'edit']`          |
| `RESOURCE_ACTION_MAP`  | Action → URI template map.                     |
| `SINGLETON_ACTIONS`    | `['create', 'show', 'edit']`                   |
| `SINGLETON_ACTION_MAP` | Singleton action → URI map.                    |
| `patterns`             | Built-in regex patterns (`number`, `uuid`, …). |

## Types

Exported type aliases and interfaces:

`RouteComponent` · `MiddlewareFn` · `GuardResult` · `MissingHandler` ·
`BindingResolver<T>` · `BindingResolverContext` · `AppRouteMeta` ·
`GroupAttributes` · `ResolvedContext` · `ResourceOptions` · `HistoryMode` ·
`CreateAppRouterOptions` · `NamedRouteEntry` · `RegisteredRoute` ·
`RouteDefinitionHost` · `ResourceAction` · `ResourceActionConfig` ·
`SingletonAction` · `PatternName` · `ParamValue` · `ParamToken`.

### `ResourceOptions`

```ts
interface ResourceOptions {
  only?: readonly string[] // restrict to these actions
  except?: readonly string[] // exclude these actions
  components?: Partial<Record<string, RouteComponent>> // per-action component
  parameters?: Record<string, string> // override the param name per segment
  names?: string // override the route-name prefix
  creatable?: boolean // singleton() only: also register `create`
}
```

### `BindingResolverContext`

```ts
interface BindingResolverContext {
  field: string | undefined // custom {param:field} column
  parent: unknown // nearest resolved parent (when scoped)
  bound: Readonly<Record<string, unknown>> // models resolved so far
}
```

### Meta augmentation

The package augments vue-router's `RouteMeta` with `AppRouteMeta`, so
`to.meta.middleware`, `to.meta.bound`, `to.meta.action`, `to.meta.isView`, etc.
are typed in your app with no setup.

## Tree-shakeable utilities

Pure helpers are exported for advanced use:

- **Paths:** `joinPaths` · `ensureLeadingSlash` · `collapseSlashes` ·
  `convertLaravelParams` · `extractParamNames` · `extractBindingFields` ·
  `compileUrl` · `applyWhereConstraints`
- **Text:** `appendRouteName` · `splitWords` · `pluralize` · `singularize`
