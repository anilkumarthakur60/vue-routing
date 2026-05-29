# Routing

## Basic routes

```ts
Route.get('about', AboutPage).name('about')
```

`get` registers a navigable route. The first argument is the URI, the second the
component (eager or a lazy `() => import(...)`).

### View routes

`view` is `get` plus optional static props:

```ts
Route.view('about', AboutPage, { version: '1.0.0' }).name('about')
```

### Redirects

```ts
Route.redirect('here', '/there') // 302
Route.redirect('here', '/there', 301) // custom status
Route.permanentRedirect('home', '/dashboard') // 301
```

### Fallback (404)

```ts
Route.fallback(NotFoundPage)
```

Matches `/:pathMatch(.*)*` and is registered under the name `NotFound`.

## Route parameters

Both Laravel `{param}` and vue-router `:param` syntaxes work and interoperate.

```ts
Route.get('users/{id}', UserPage).name('users.show') // required
Route.get('user/{name?}', UserPage).name('user') // optional
Route.get('posts/{post:slug}', PostPage).name('posts.show') // custom key
```

## Constraints

Constrain parameters with regular expressions:

```ts
Route.get('users/{id}', UserPage).where({ id: '[0-9]+' })

// Convenience helpers:
Route.get('users/{id}', UserPage).whereNumber('id')
Route.get('users/{name}', UserPage).whereAlpha('name')
Route.get('users/{slug}', UserPage).whereAlphaNumeric('slug')
Route.get('users/{id}', UserPage).whereUuid('id')
Route.get('users/{id}', UserPage).whereUlid('id')
Route.get('cat/{c}', Page).whereIn('c', ['movie', 'song'])
```

### Global patterns

Apply a constraint to every matching parameter name:

```ts
Route.pattern('id', '[0-9]+')
Route.patterns({ id: '[0-9]+', uuid: '[0-9a-f-]+' })
```

## Named routes & URL generation

```ts
Route.get('users/{id}/profile', Page).name('profile')

Route.route('profile', { id: 1 }) // → '/users/1/profile'
Route.route('profile', { id: 1, tab: 'a' }) // → '/users/1/profile?tab=a'
Route.has('profile') // → true
```

## Resources

A single call generates the navigable resource routes — `index`, `create`,
`show`, `edit`:

```ts
Route.resource('posts', PostsPage)
// posts.index   /posts
// posts.create  /posts/create
// posts.show    /posts/:id
// posts.edit    /posts/:id/edit
```

Server-side actions (`store`/`update`/`destroy`) have no page, so they are not
generated. Restrict actions or override components per action:

```ts
Route.resource('posts', PostsPage, {
  only: ['index', 'show'],
  components: { show: PostShowPage },
})
```

## Inspecting routes

```ts
Route.toList() // → [{ path, name, middleware }, ...]
Route.list() // console.table(...) for debugging
```
