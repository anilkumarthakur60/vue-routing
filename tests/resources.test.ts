import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route } from '@/lib'

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
})

describe('resources() — bulk registration', () => {
  it('registers many resources from a map', () => {
    Route.resources({ photos: Page, videos: Page }, { only: ['index', 'show'] })
    const names = Route.toList().map((r) => r.name)
    expect(names).toEqual(['photos.index', 'photos.show', 'videos.index', 'videos.show'])
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
})
