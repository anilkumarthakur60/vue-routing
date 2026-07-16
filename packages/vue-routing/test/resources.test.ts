import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, patterns } from '@anil-labs/vue-routing'
import type { MiddlewareFn, MissingHandler } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

/** name → path map of all registered routes. */
function routeMap(): Record<string, string> {
  return Object.fromEntries(Route.toList().map((row) => [row.name, row.path]))
}

beforeEach(() => {
  Route.flush()
})

describe('resource() — parameter naming', () => {
  it('uses the singularized resource name as the parameter', () => {
    Route.resource('users', Page)
    const map = routeMap()
    expect(map['users.index']).toBe('/users')
    expect(map['users.create']).toBe('/users/create')
    expect(map['users.show']).toBe('/users/:user')
    expect(map['users.edit']).toBe('/users/:user/edit')
  })

  it('singularizes irregular plurals', () => {
    Route.resource('categories', Page)
    expect(routeMap()['categories.show']).toBe('/categories/:category')
  })

  it('honors a parameters override', () => {
    Route.resource('users', Page, { parameters: { users: 'admin_user' } })
    expect(routeMap()['users.show']).toBe('/users/:admin_user')
  })

  it('singularizes -es plurals to the right parameter (audit: buses → :bus)', () => {
    Route.resource('buses', Page)
    expect(routeMap()['buses.show']).toBe('/buses/:bus')
  })
})

describe('resource() — filtering & components', () => {
  it('restricts with only / except', () => {
    Route.resource('a', Page, { only: ['index', 'show'] })
    Route.resource('b', Page, { except: ['create', 'edit'] })
    const names = Route.toList().map((r) => r.name)
    expect(names.filter((n) => n.startsWith('a.'))).toEqual(['a.index', 'a.show'])
    expect(names.filter((n) => n.startsWith('b.'))).toEqual(['b.index', 'b.show'])
  })

  it('overrides the route name prefix via names', () => {
    Route.resource('photos', Page, { names: 'images' })
    const names = Route.toList().map((r) => r.name)
    expect(names).toContain('images.index')
    expect(names).toContain('images.show')
    expect(names).not.toContain('photos.index')
  })

  it('gives only() priority when both only and except are provided (audit test gap)', () => {
    Route.resource('r', Page, { only: ['index'], except: ['index'] })
    expect(Route.toList().map((row) => row.name)).toEqual(['r.index'])
  })
})

describe('resource() — nesting & merging', () => {
  it('builds nested dot-notation resources', () => {
    Route.resource('photos.comments', Page)
    const map = routeMap()
    expect(map['photos.comments.index']).toBe('/photos/:photo/comments')
    expect(map['photos.comments.create']).toBe('/photos/:photo/comments/create')
    expect(map['photos.comments.show']).toBe('/photos/:photo/comments/:comment')
    expect(map['photos.comments.edit']).toBe('/photos/:photo/comments/:comment/edit')
  })

  it('overrides a parent segment parameter of a dotted resource (audit test gap)', () => {
    Route.resource('photos.comments', Page, { parameters: { photos: 'img' } })
    const map = routeMap()
    expect(map['photos.comments.index']).toBe('/photos/:img/comments')
    expect(map['photos.comments.show']).toBe('/photos/:img/comments/:comment')
  })

  it('merges onto an enclosing prefix instead of overwriting it', () => {
    Route.prefix('admin')
      .asPrefix('admin')
      .group(() => {
        Route.resource('posts', Page)
      })
    const map = routeMap()
    expect(map['admin.posts.index']).toBe('/admin/posts')
    expect(map['admin.posts.show']).toBe('/admin/posts/:post')
  })

  it('merges a same-level prefix/name set directly on the chain', () => {
    Route.prefix('admin').asPrefix('admin').resource('posts', Page)
    const map = routeMap()
    expect(map['admin.posts.index']).toBe('/admin/posts')
    expect(map['admin.posts.show']).toBe('/admin/posts/:post')
  })
})

describe('resources() — bulk registration', () => {
  it('registers many resources from a map', () => {
    Route.resources({ photos: Page, videos: Page }, { only: ['index', 'show'] })
    const names = Route.toList().map((r) => r.name)
    expect(names).toEqual(['photos.index', 'photos.show', 'videos.index', 'videos.show'])
  })

  it('a shared names option collides on the second resource (audit test gap)', () => {
    // resources() forwards ONE options object to every resource, so a shared
    // `names` guarantees a duplicate-name conflict on different paths.
    Route.resources({ a: Page, b: Page }, { names: 'x' })
    expect(() => Route.toList()).toThrow(/already defined/)
  })
})

describe('pending resource — full fluent surface', () => {
  it('applies parameter(), whereNumber(), missing(), and scopeBindings()', () => {
    const handler: MissingHandler = () => undefined
    Route.resource('boxes', Page)
      .only('show')
      .parameter('boxes', 'box_id')
      .whereNumber('box_id')
      .missing(handler)
      .scopeBindings()
    expect(routeMap()).toEqual({ 'boxes.show': '/boxes/:box_id([0-9]+)' })
    const record = Route.getRoutes()[0]
    expect(record?.meta?.missing).toBe(handler)
    expect(record?.meta?.scopeBindings).toBe(true)
  })

  it('applies withoutMiddleware() against inherited group middleware', () => {
    const log: MiddlewareFn = () => true
    const audit: MiddlewareFn = () => true
    Route.middleware(log, audit).group(() => {
      Route.resource('things', Page).only('show').withoutMiddleware(audit).whereAlpha('thing')
    })
    expect(routeMap()['things.show']).toBe(`/things/:thing(${patterns.alpha})`)
    const record = Route.getRoutes()[0]
    expect(record?.meta?.middleware).toEqual([log])
    expect(record?.meta?.excludedMiddleware).toEqual([audit])
  })

  it('exposes every remaining constraint/scoping helper on a pending resource', () => {
    Route.resource('a', Page).only('show').where({ a: '[0-9]+' })
    Route.resource('b', Page).only('show').whereAlphaNumeric('b')
    Route.resource('c', Page).only('show').whereUuid('c')
    Route.resource('d', Page).only('show').whereUlid('d')
    Route.resource('e', Page).only('show').whereIn('e', ['x', 'y'])
    Route.resource('f', Page).only('show').withoutScopedBindings()
    const map = routeMap()
    expect(map['a.show']).toBe('/a/:a([0-9]+)')
    expect(map['b.show']).toBe(`/b/:b(${patterns.alphaNumeric})`)
    expect(map['c.show']).toBe(`/c/:c(${patterns.uuid})`)
    expect(map['d.show']).toBe(`/d/:d(${patterns.ulid})`)
    expect(map['e.show']).toBe('/e/:e(x|y)')
    const scopeless = Route.getRoutes().find((record) => record.name === 'f.show')
    expect(scopeless?.meta?.withoutScopedBindings).toBe(true)
  })

  it('a second commit() is a no-op (no duplicate registration)', () => {
    const pending = Route.resource('users', Page).only('index')
    expect(Route.toList()).toHaveLength(1)
    expect(() => {
      pending.commit()
    }).not.toThrow()
    expect(Route.toList()).toHaveLength(1)
  })

  it('fans out except/parameters/where/withoutMiddleware/missing across resources()', () => {
    const log: MiddlewareFn = () => true
    const audit: MiddlewareFn = () => true
    const handler: MissingHandler = () => undefined
    Route.middleware(log, audit).group(() => {
      Route.resources({ cars: Page, vans: Page })
        .except('index', 'create', 'edit')
        .parameters({ cars: 'car_id', vans: 'van_id' })
        .where({ car_id: '[0-9]+' })
        .withoutMiddleware(audit)
        .missing(handler)
    })
    expect(routeMap()).toEqual({
      'cars.show': '/cars/:car_id([0-9]+)',
      'vans.show': '/vans/:van_id',
    })
    for (const record of Route.getRoutes()) {
      expect(record.meta?.middleware).toEqual([log])
      expect(record.meta?.excludedMiddleware).toEqual([audit])
      expect(record.meta?.missing).toBe(handler)
    }
  })
})

describe('singleton()', () => {
  it('registers show + edit with no identifier', () => {
    Route.singleton('profile', Page)
    const map = routeMap()
    expect(map['profile.show']).toBe('/profile')
    expect(map['profile.edit']).toBe('/profile/edit')
    expect(Route.toList()).toHaveLength(2)
  })

  it('adds create when creatable', () => {
    Route.singleton('profile', Page, { creatable: true })
    const map = routeMap()
    expect(map['profile.create']).toBe('/profile/create')
    expect(map['profile.show']).toBe('/profile')
    expect(map['profile.edit']).toBe('/profile/edit')
  })

  it('supports nesting and only/except', () => {
    Route.singleton('photos.thumbnail', Page, { only: ['show'] })
    const map = routeMap()
    expect(map['photos.thumbnail.show']).toBe('/photos/:photo/thumbnail')
    expect(Route.toList()).toHaveLength(1)
  })

  it('honors except under an enclosing prefix (audit test gap)', () => {
    Route.prefix('admin')
      .asPrefix('admin')
      .group(() => {
        Route.singleton('profile', Page, { except: ['edit'] })
      })
    expect(routeMap()).toEqual({ 'admin.profile.show': '/admin/profile' })
  })

  it('registers only create for a creatable singleton restricted with only (audit test gap)', () => {
    Route.singleton('settings', Page, { creatable: true, only: ['create'] })
    expect(routeMap()).toEqual({ 'settings.create': '/settings/create' })
  })
})
