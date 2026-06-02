# Resources

A single call generates the conventional set of routes for a resource — the
client-side subset of Laravel's `Route::resource`.

## `resource()`

```ts
Route.resource('posts', PostsPage)
```

generates the four **navigable** actions:

| Name           | Method URI          | Action   |
| -------------- | ------------------- | -------- |
| `posts.index`  | `/posts`            | `index`  |
| `posts.create` | `/posts/create`     | `create` |
| `posts.show`   | `/posts/:post`      | `show`   |
| `posts.edit`   | `/posts/:post/edit` | `edit`   |

The route parameter is the **singularized** resource name (`posts` → `{post}`,
`categories` → `{category}`). This is what makes [model binding](/guide/model-binding)
work with resources — bind the `post` param and it resolves for `show` and `edit`.

::: info Why no store/update/destroy?
`store`, `update`, and `destroy` are server-side mutations with no page to
render, so they are intentionally not generated. Your component is the handler.
:::

## Restricting actions

```ts
Route.resource('posts', PostsPage, { only: ['index', 'show'] })
Route.resource('posts', PostsPage, { except: ['create', 'edit'] })
```

## Per-action components

Override the shared component for specific actions:

```ts
Route.resource('posts', PostsPage, {
  components: {
    show: PostShowPage,
    edit: PostEditPage,
  },
})
```

## Customizing the parameter

Override the singularized parameter name per segment (Laravel's `->parameters()`):

```ts
Route.resource('users', UsersPage, { parameters: { users: 'admin_user' } })
// users.show → /users/:admin_user
```

## Customizing the name prefix

```ts
Route.resource('photos', PhotosPage, { names: 'images' })
// images.index, images.show, …
```

## Nested resources

Dot-notation builds nested resources, threading a parent parameter through the
URI (Laravel's `photos.comments`):

```ts
Route.resource('photos.comments', CommentsPage)
// photos.comments.index   /photos/:photo/comments
// photos.comments.create  /photos/:photo/comments/create
// photos.comments.show    /photos/:photo/comments/:comment
// photos.comments.edit    /photos/:photo/comments/:comment/edit
```

## Registering many at once

```ts
Route.resources({ photos: PhotosPage, videos: VideosPage }, { only: ['index', 'show'] })
```

## Resources inside groups

`resource()` composes with groups — prefixes and name prefixes merge:

```ts
Route.prefix('admin')
  .asPrefix('admin')
  .middleware(auth)
  .group(() => {
    Route.resource('posts', PostsPage)
    // admin.posts.index → /admin/posts, with auth middleware
  })
```

## Singleton resources

A **singleton** has no identifier — use it for one-per-context resources like a
profile or a site's settings (Laravel's `Route::singleton`):

```ts
Route.singleton('profile', ProfilePage)
// profile.show  /profile
// profile.edit  /profile/edit
```

Add the `create` action with `creatable`:

```ts
Route.singleton('profile', ProfilePage, { creatable: true })
// profile.create /profile/create · profile.show /profile · profile.edit /profile/edit
```

Singletons support nesting and `only`/`except`/`components` too:

```ts
Route.singleton('photos.thumbnail', ThumbnailPage)
// photos.thumbnail.show → /photos/:photo/thumbnail
```

## Reading the current action

Inside a resource page, [`useRouteAction()`](/guide/composables#userouteaction)
returns `'index' | 'show' | 'create' | 'edit'`, so one component can branch on
the action it's serving.
