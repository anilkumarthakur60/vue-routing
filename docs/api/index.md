# API Reference

Everything below is exported from the package root, `@anil-labs/vue-routing`.

## `Route`

The singleton facade (an instance of `Router`), and the package's default export:

```ts
import { Route } from '@anil-labs/vue-routing'
import Route from '@anil-labs/vue-routing' // same instance
```

### `createRouteFacade()`

Creates an **isolated** `Router` facade with its own registry state. Prefer it
over the shared singleton whenever the module graph can be evaluated more than
once against a cached copy of the library  Vite SSR dev, HMR boundaries,
per-request SSR, cross-file tests:

```ts
import { createRouteFacade } from '@anil-labs/vue-routing'

export function defineRoutes(Route = createRouteFacade()) {
  Route.get('/', Home).name('home')
  return Route
}
```

See [Getting Started](/guide/getting-started#ssr-hmr-isolated-facades).

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

Each returns a `RouteDefinition`, except the resource methods, which return
[pending registrations](#pendingresourceregistration). See
[Defining Routes](/guide/routing) and [Resources](/guide/resources).

| Method                              | Description                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `get(uri, component)`               | A navigable route (`props: true`).                                                                   |
| `view(uri, component, props?)`      | A route with static props (merged over route params).                                                |
| `redirect(from, to, status = 302)`  | A redirect; shared `{param}`s are substituted into the target.                                       |
| `permanentRedirect(from, to)`       | A 301 redirect.                                                                                      |
| `fallback(component)`               | The 404 route, scoped to the group prefix; named `NotFound`, group-name-prefixed (`admin.NotFound`). |
| `resource(name, component, opts?)`  | index/create/show/edit routes → `PendingResourceRegistration`.                                       |
| `resources(map, opts?)`             | Several resources at once → `PendingResourceCollection`.                                             |
| `singleton(name, component, opts?)` | show/edit (+ create if creatable) → `PendingSingletonRegistration`.                                  |

### Group opener

- `group(cb)`  open a group using the accumulated attributes.
- `group(options, cb)`  merge extra [`GroupAttributes`](#types) attribute-wise
  with the accumulated ones (middleware concatenates, prefixes append), then
  open.

Group callbacks must be **synchronous**  passing an `async` callback throws.
See [Groups & Layouts](/guide/groups-and-layouts#group-callbacks-are-synchronous).

### Patterns & bindings

| Method                   | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `pattern(name, regex)`   | Global constraint for a parameter name  applied lazily, so declaration order is irrelevant. |
| `patterns(map)`          | Several global constraints.                                                                  |
| `bind(param, resolver)`  | Explicit model-binding resolver.                                                             |
| `model(param, resolver)` | Alias of `bind`.                                                                             |
| `getBindings()`          | A snapshot of the bindings map for `createAppRouter`.                                        |

### Inspection & export

| Method                 | Returns                                                   |
| ---------------------- | --------------------------------------------------------- |
| `getRoutes()`          | `RouteRecordRaw[]` for `createAppRouter` (a fresh array). |
| `route(name, params?)` | A generated URL string.                                   |
| `has(name)`            | Whether a named route exists.                             |
| `toList(filter?)`      | `RouteListRow[]`  `{ path, name, middleware }`.          |
| `list({ path? })`      | `console.table` of the routes.                            |
| `flush()`              | Reset all state (useful in tests).                        |

## `PendingResourceRegistration`

Returned by `resource()` (and, as subclasses, by `singleton()` and
`resources()`). The routes register lazily, so methods chained immediately
after the call genuinely apply  Laravel's `PendingResourceRegistration`.
Pending routes commit automatically before the next registration or router
query; chaining after commit throws. See
[Resources → Fluent chaining](/guide/resources#fluent-chaining).

| Method                                              | Description                          |
| --------------------------------------------------- | ------------------------------------ |
| `only(...actions)` / `except(...actions)`           | Restrict / exclude actions.          |
| `names(base)`                                       | Override the route-name prefix.      |
| `parameters(map)` / `parameter(segment, param)`     | Override route parameter names.      |
| `middleware(...)` / `withoutMiddleware(...)`        | Middleware for every resource route. |
| `where(map)` / `whereNumber` / … / `whereIn`        | Constraints on the resource params.  |
| `missing(handler)`                                  | Missing-model handler.               |
| `scopeBindings()` / `withoutScopedBindings()`       | Binding scoping.                     |
| `creatable()` _(PendingSingletonRegistration only)_ | Also register `create`.              |

`PendingResourceCollection` (from `resources()`) fans `only` / `except` /
`parameters` / `middleware` / `withoutMiddleware` / `where` / `missing` out to
every resource it holds.

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
  scrollBehavior?: Router['options']['scrollBehavior'] // default: saved position, else top-left
  bindings?: Map<string, BindingResolver> // from Route.getBindings()
  hostname?: string // for domain() routes; SSR: the request's Host header
}
```

- **Domain filtering**  records whose `domain()` does not match the effective
  hostname (`hostname` option → `window.location.hostname`) are dropped before
  the router is created, so the same path registered under several domains
  matches per host. Without a hostname (SSR without the option), filtering is
  skipped. See [Subdomains](/guide/subdomains).
- **Scroll behavior**  the default restores the saved position on
  back/forward navigation and scrolls to top-left otherwise.

The single `beforeEach` guard runs, in order:

1. **Subdomain checks**  validates each matched route's `domain` against the
   effective hostname (cancels on mismatch; a safety net on top of the
   creation-time filtering).
2. **Middleware pipeline**  collects, de-duplicates, and runs middleware from
   all matched records; the first redirect/cancel result wins.
3. **Model-binding resolution**  resolves bound params (parent → child) and
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

- `createNavigationGuard(bindings?, hostname?)`  the `beforeEach` guard used by
  `createAppRouter`; `hostname` scopes domain validation (pass the request's
  `Host` header in SSR).
- `collectMiddleware(to)`  the ordered, de-duplicated middleware chain for a target.
- `runMiddleware(chain, to, from)`  run a chain; first redirect/cancel wins.

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
`GroupAttributes` · `ResolvedContext` · `ResourceOptions` · `SingletonOptions` ·
`HistoryMode` · `CreateAppRouterOptions` · `NamedRouteEntry` ·
`RegisteredRoute` · `RouteDefinitionHost` · `RouteListRow` · `ResourceAction` ·
`ResourceActionConfig` · `SingletonAction` · `PatternName` · `ParamValue` ·
`ParamToken`.

### `ResourceOptions` / `SingletonOptions`

The action union is a type parameter, so `only` / `except` / `components` keys
are checked against the real action names  a typo like `only: ['idnex']`
fails to compile:

```ts
interface ResourceOptions<TAction extends string = ResourceAction> {
  only?: readonly TAction[] // restrict to these actions
  except?: readonly TAction[] // exclude these actions
  components?: Partial<Record<TAction, RouteComponent>> // per-action component
  parameters?: Record<string, string> // override the param name per segment
  names?: string // override the route-name prefix
}

interface SingletonOptions extends ResourceOptions<SingletonAction> {
  creatable?: boolean // also register `create`
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
