import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { Route } from '@/lib'
import type { MiddlewareFn } from '@/lib'

/** Minimal stub component — never mounted, only inspected. */
const stub = (name: string): Component => ({ name, render: () => null })

/** Typed child accessor for assertions (only wrappers carry children). */
function childrenOf(record: RouteRecordRaw | undefined): RouteRecordRaw[] {
  if (!record) return []
  return (record as { children?: RouteRecordRaw[] }).children ?? []
}

const Home = stub('Home')
const Login = stub('Login')
const Dashboard = stub('Dashboard')
const Users = stub('Users')
const NotFound = stub('NotFound')
const MainLayout = stub('MainLayout')
const AuthLayout = stub('AuthLayout')

beforeEach(() => {
  Route.flush()
})

describe('basic registration', () => {
  it('registers a top-level view route with a name and meta', () => {
    Route.view('login', Login).name('login')
    const routes = Route.getRoutes()
    expect(routes).toHaveLength(1)
    const [record] = routes
    expect(record?.path).toBe('/login')
    expect(record?.name).toBe('login')
    expect(record?.meta?.isView).toBe(true)
  })

  it('registers a plain get route', () => {
    Route.get('users', Users).name('users.index')
    expect(Route.getRoutes()[0]?.path).toBe('/users')
    expect(Route.getRoutes()[0]?.name).toBe('users.index')
  })

  it('throws on duplicate route names', () => {
    Route.get('a', Home).name('dup')
    expect(() => Route.get('b', Home).name('dup')).toThrow(/already defined/)
  })
})

describe('groups', () => {
  it('applies prefix and name prefix', () => {
    Route.prefix('users')
      .asPrefix('users')
      .group(() => {
        Route.view('', Users).name('index')
      })
    const [record] = Route.getRoutes()
    expect(record?.path).toBe('/users')
    expect(record?.name).toBe('users.index')
  })

  it('merges nested prefixes and names', () => {
    Route.prefix('admin')
      .name('admin')
      .group(() => {
        Route.prefix('users')
          .name('users')
          .group(() => {
            Route.get('', Users).name('index')
          })
      })
    const [record] = Route.getRoutes()
    expect(record?.path).toBe('/admin/users')
    expect(record?.name).toBe('admin.users.index')
  })

  it('honors an explicit trailing dot in a name prefix', () => {
    Route.name('admin.').group(() => {
      Route.get('users', Users).name('users')
    })
    expect(Route.getRoutes()[0]?.name).toBe('admin.users')
  })
})

describe('layouts', () => {
  it('wraps routes in a layout and reuses the wrapper for siblings', () => {
    Route.layout(MainLayout).group(() => {
      Route.view('dashboard', Dashboard).name('dashboard')
      Route.view('profile', Home).name('profile')
    })
    const routes = Route.getRoutes()
    expect(routes).toHaveLength(1)
    const wrapper = routes[0]
    expect(wrapper?.path).toBe('/')
    const children = childrenOf(wrapper)
    expect(children.map((child) => child.path)).toEqual(['dashboard', 'profile'])
    expect(children.map((child) => child.name)).toEqual(['dashboard', 'profile'])
  })

  it('nests multiple layouts', () => {
    Route.layout(MainLayout).group(() => {
      Route.layout(AuthLayout).group(() => {
        Route.view('settings', Home).name('settings')
      })
    })
    const outer = Route.getRoutes()[0]
    expect(outer?.path).toBe('/')
    const inner = childrenOf(outer)[0]
    expect(inner?.path).toBe('')
    const leaf = childrenOf(inner)[0]
    expect(leaf?.path).toBe('settings')
    expect(leaf?.name).toBe('settings')
  })

  it('propagates group middleware onto the page record', () => {
    const auth: MiddlewareFn = () => true
    Route.middleware(auth)
      .layout(MainLayout)
      .group(() => {
        Route.view('dashboard', Dashboard).name('dashboard')
      })
    const leaf = childrenOf(Route.getRoutes()[0])[0]
    expect(leaf?.meta?.middleware).toContain(auth)
  })
})

describe('middleware modifiers', () => {
  it('removes excluded middleware from a route', () => {
    const a: MiddlewareFn = () => true
    const b: MiddlewareFn = () => true
    Route.middleware(a, b).group(() => {
      Route.get('x', Home).name('x').withoutMiddleware(a)
    })
    const meta = Route.getRoutes()[0]?.meta
    expect(meta?.middleware).toEqual([b])
    expect(meta?.excludedMiddleware).toEqual([a])
  })
})

describe('constraints', () => {
  it('applies whereNumber to the routing path but not the named path', () => {
    Route.get('user/{id}', Home).whereNumber('id').name('user.show')
    const record = Route.getRoutes()[0]
    expect(record?.path).toBe('/user/:id([0-9]+)')
    expect(record?.meta?.where).toEqual({ id: '[0-9]+' })
    // URL generation uses the clean path:
    expect(Route.route('user.show', { id: 42 })).toBe('/user/42')
  })

  it('supports whereIn', () => {
    Route.get('category/{category}', Home).whereIn('category', ['movie', 'song']).name('cat')
    expect(Route.getRoutes()[0]?.path).toBe('/category/:category(movie|song)')
  })
})

describe('redirects and fallback', () => {
  it('registers a redirect with status meta', () => {
    Route.redirect('here', '/there')
    Route.permanentRedirect('old', '/new')
    const [first, second] = Route.getRoutes()
    expect(first).toMatchObject({ path: '/here', redirect: '/there' })
    expect(first?.meta?.redirectStatus).toBe(302)
    expect(second?.meta?.redirectStatus).toBe(301)
  })

  it('registers a fallback route named NotFound', () => {
    Route.fallback(NotFound)
    const record = Route.getRoutes()[0]
    expect(record?.path).toBe('/:pathMatch(.*)*')
    expect(record?.name).toBe('NotFound')
    expect(record?.meta?.isFallback).toBe(true)
    expect(Route.has('NotFound')).toBe(true)
  })
})

describe('resourceful routing', () => {
  it('registers the four navigable resource routes with names', () => {
    Route.resource('posts', Home)
    const rows = Route.toList()
    const byName = Object.fromEntries(rows.map((row) => [row.name, row.path]))
    expect(byName['posts.index']).toBe('/posts')
    expect(byName['posts.create']).toBe('/posts/create')
    expect(byName['posts.show']).toBe('/posts/:id')
    expect(byName['posts.edit']).toBe('/posts/:id/edit')
    // No store/update/destroy — those are server-side mutations with no page.
    expect(rows).toHaveLength(4)
  })

  it('honors only/except and per-action components', () => {
    const ShowPage = stub('ShowPage')
    Route.resource('books', Home, { only: ['index', 'show'], components: { show: ShowPage } })
    const rows = Route.toList()
    expect(rows).toHaveLength(2)
    const show = Route.toList().find((row) => row.name === 'books.show')
    expect(show?.path).toBe('/books/:id')
  })
})

describe('url generation', () => {
  it('builds urls with params and query', () => {
    Route.get('user/{id}/profile', Home).name('profile')
    expect(Route.route('profile', { id: 1 })).toBe('/user/1/profile')
    expect(Route.route('profile', { id: 1, photos: 'yes' })).toBe('/user/1/profile?photos=yes')
  })

  it('throws for unknown route names', () => {
    expect(() => Route.route('nope')).toThrow(/not defined/)
  })
})
