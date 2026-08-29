import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter } from '@anil-labs/vue-routing'
import type { BindingResolverContext } from '@anil-labs/vue-routing'

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

  it('receives decoded param values (audit test gap)', async () => {
    const seen: string[] = []
    Route.get('users/{user}', Page).name('users.show')
    Route.bind('user', (value) => {
      seen.push(value)
      return { value }
    })
    const router = build()
    await router.push('/users/a%20b')
    expect(seen).toEqual(['a b'])
    expect(router.currentRoute.value.meta.bound).toEqual({ user: { value: 'a b' } })
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

describe('async binding resolvers (audit test gap: Promise-typed resolvers)', () => {
  it('awaits resolvers sequentially in path-param order', async () => {
    const order: string[] = []
    Route.get('a/{x}/b/{y}', Page).name('ab')
    Route.bind('x', async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
      order.push('x')
      return { param: 'x' }
    })
    Route.bind('y', () => {
      order.push('y')
      return { param: 'y' }
    })
    const router = build()
    await router.push('/a/1/b/2')
    expect(order).toEqual(['x', 'y'])
    expect(router.currentRoute.value.meta.bound).toEqual({
      x: { param: 'x' },
      y: { param: 'y' },
    })
  })

  it('treats an async null resolution as missing', async () => {
    Route.view('list', Page).name('users.index')
    Route.get('users/{user}', Page)
      .name('users.show')
      .missing(() => ({ name: 'users.index' }))
    Route.bind('user', () => Promise.resolve(null))
    const router = build()
    await router.push('/users/1')
    expect(router.currentRoute.value.name).toBe('users.index')
  })

  it('propagates a rejecting resolver as a navigation error', async () => {
    Route.view('home', Page).name('home')
    Route.get('users/{user}', Page).name('users.show')
    Route.bind('user', async () => {
      await Promise.resolve()
      throw new Error('resolver exploded')
    })
    const router = build()
    await router.push('/home')
    await expect(router.push('/users/1')).rejects.toThrow('resolver exploded')
    expect(router.currentRoute.value.name).toBe('home')
  })
})

describe('missing() nearest-handler precedence (audit test gap)', () => {
  it('runs a group-level missing handler at runtime', async () => {
    Route.view('fallback', Page).name('group.fallback')
    Route.missing(() => ({ name: 'group.fallback' })).group(() => {
      Route.get('users/{user}', Page).name('users.show')
    })
    Route.bind('user', () => null)
    const router = build()
    await router.push('/users/1')
    expect(router.currentRoute.value.name).toBe('group.fallback')
  })

  it('route-level missing() wins over the group handler', async () => {
    Route.view('g', Page).name('group.fallback')
    Route.view('l', Page).name('leaf.fallback')
    Route.missing(() => ({ name: 'group.fallback' })).group(() => {
      Route.get('users/{user}', Page)
        .name('users.show')
        .missing(() => ({ name: 'leaf.fallback' }))
    })
    Route.bind('user', () => null)
    const router = build()
    await router.push('/users/1')
    expect(router.currentRoute.value.name).toBe('leaf.fallback')
  })
})

describe('optional custom-key params ({post:slug?}) end-to-end (audit test gap)', () => {
  it('hands the custom field to the resolver and matches without the segment', async () => {
    const calls: { value: string; field: string | undefined }[] = []
    Route.get('posts/{post:slug?}', Page).name('posts.show')
    Route.bind('post', (value, _to, context) => {
      calls.push({ value, field: context.field })
      return { value }
    })
    const router = build()
    await router.push('/posts/hello')
    expect(router.currentRoute.value.name).toBe('posts.show')
    expect(calls).toEqual([{ value: 'hello', field: 'slug' }])
    // The segment is optional  the bare prefix matches the same route.
    await router.push('/posts')
    expect(router.currentRoute.value.name).toBe('posts.show')
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

  it('passes the immediately-preceding model as parent in a 3-level chain (audit test gap)', async () => {
    const snapshots: { parent: unknown; bound: Record<string, unknown> }[] = []
    Route.scopeBindings().group(() => {
      Route.get('a/{x}/b/{y}/c/{z}', Page).name('abc')
    })
    Route.bind('x', () => ({ model: 'x' }))
    Route.bind('y', () => ({ model: 'y' }))
    Route.bind('z', (_value, _to, context) => {
      snapshots.push({ parent: context.parent, bound: { ...context.bound } })
      return { model: 'z' }
    })
    const router = build()
    await router.push('/a/1/b/2/c/3')
    expect(snapshots).toEqual([
      { parent: { model: 'y' }, bound: { x: { model: 'x' }, y: { model: 'y' } } },
    ])
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
