import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter } from '@/lib'
import type { BindingResolverContext } from '@/lib'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

const build = () =>
  createAppRouter({
    routes: Route.getRoutes(),
    historyMode: 'memory',
    bindings: Route.getBindings(),
  })

beforeEach(() => {
  Route.flush()
})

describe('explicit binding resolution', () => {
  it('resolves a model into meta.bound', async () => {
    Route.get('users/{user}', Page).name('users.show')
    Route.bind('user', (value) => (value === '1' ? { id: 1, name: 'Ada' } : null))
    const router = build()
    await router.push('/users/1')
    expect(router.currentRoute.value.meta.bound).toEqual({ user: { id: 1, name: 'Ada' } })
  })

  it('cancels navigation when the resolver returns null', async () => {
    Route.view('home', Page).name('home')
    Route.get('users/{user}', Page).name('users.show')
    Route.bind('user', (value) => (value === '1' ? { id: 1 } : null))
    const router = build()
    await router.push('/home')
    await router.push('/users/999').catch(() => undefined)
    expect(router.currentRoute.value.path).toBe('/home')
  })

  it('runs the missing() handler when a model is absent', async () => {
    Route.view('list', Page).name('users.index')
    Route.get('users/{user}', Page)
      .name('users.show')
      .missing(() => ({ name: 'users.index' }))
    Route.bind('user', () => null)
    const router = build()
    await router.push('/users/5')
    expect(router.currentRoute.value.name).toBe('users.index')
  })

  it('cancels when missing() returns nothing', async () => {
    Route.view('home', Page).name('home')
    Route.get('users/{user}', Page)
      .name('users.show')
      .missing(() => undefined)
    Route.bind('user', () => null)
    const router = build()
    await router.push('/home')
    await router.push('/users/5').catch(() => undefined)
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('ignores params that have no registered resolver', async () => {
    Route.get('a/{b}', Page).name('a.show')
    Route.bind('user', () => ({ id: 1 })) // a different param, so bindings map is non-empty
    const router = build()
    await router.push('/a/42')
    expect(router.currentRoute.value.meta.bound).toEqual({})
  })

  it('resolves the first segment of an array (repeatable) param', async () => {
    Route.get('files/:path(.*)*', Page).name('files.show')
    Route.bind('path', (value) => ({ first: value }))
    const router = build()
    await router.push('/files/a/b/c')
    expect(router.currentRoute.value.meta.bound).toEqual({ path: { first: 'a' } })
  })
})

describe('custom binding key {param:field}', () => {
  it('passes the custom column to the resolver as context.field', async () => {
    const seen: BindingResolverContext[] = []
    Route.get('posts/{post:slug}', Page).name('posts.show')
    Route.bind('post', (value, _to, ctx) => {
      seen.push(ctx)
      return { slug: value }
    })
    const router = build()
    await router.push('/posts/hello-world')
    expect(seen[0]?.field).toBe('slug')
    expect(router.currentRoute.value.meta.bound).toEqual({ post: { slug: 'hello-world' } })
  })
})

describe('scoped bindings', () => {
  it('passes the resolved parent to a child resolver when scopeBindings() is set', async () => {
    const childCtx = vi.fn()
    Route.scopeBindings().group(() => {
      Route.get('users/{user}/posts/{post}', Page).name('users.posts.show')
    })
    Route.bind('user', () => ({ id: 7, name: 'Ada' }))
    Route.bind('post', (value, _to, ctx) => {
      childCtx(ctx.parent)
      return { id: value }
    })
    const router = build()
    await router.push('/users/7/posts/3')
    expect(childCtx).toHaveBeenCalledWith({ id: 7, name: 'Ada' })
  })

  it('does not pass a parent when scoping is not enabled', async () => {
    const childCtx = vi.fn()
    Route.get('users/{user}/posts/{post}', Page).name('users.posts.show')
    Route.bind('user', () => ({ id: 7 }))
    Route.bind('post', (value, _to, ctx) => {
      childCtx(ctx.parent)
      return { id: value }
    })
    const router = build()
    await router.push('/users/7/posts/3')
    expect(childCtx).toHaveBeenCalledWith(undefined)
  })

  it('withoutScopedBindings() disables an enclosing scope', async () => {
    const childCtx = vi.fn()
    Route.scopeBindings().group(() => {
      Route.get('users/{user}/posts/{post}', Page).name('users.posts.show').withoutScopedBindings()
    })
    Route.bind('user', () => ({ id: 7 }))
    Route.bind('post', (value, _to, ctx) => {
      childCtx(ctx.parent)
      return { id: value }
    })
    const router = build()
    await router.push('/users/7/posts/3')
    expect(childCtx).toHaveBeenCalledWith(undefined)
  })
})
