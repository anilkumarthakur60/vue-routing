/**
 * Runtime constraint matching (audit test gap: "constraints are never tested
 * through actual vue-router matching")  every case pushes a violating URL
 * through a real router and asserts vue-router rejects it (falls back to the
 * NotFound route), then pushes a conforming URL and asserts it matches.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter } from '@anil-labs/vue-routing'
import type { Router } from 'vue-router'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')
const NotFoundPage = stub('NotFoundPage')

const build = (): Router => createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })

beforeEach(() => {
  Route.flush()
})

describe('constraint runtime matching', () => {
  it('whereNumber accepts digits and rejects letters', async () => {
    Route.get('u/{id}', Page).whereNumber('id').name('u.show')
    Route.fallback(NotFoundPage)
    const router = build()
    await router.push('/u/abc')
    expect(router.currentRoute.value.name).toBe('NotFound')
    await router.push('/u/42')
    expect(router.currentRoute.value.name).toBe('u.show')
    expect(router.currentRoute.value.params).toEqual({ id: '42' })
  })

  it('whereUuid accepts a canonical uuid and rejects near-misses', async () => {
    Route.get('items/{key}', Page).whereUuid('key').name('items.show')
    Route.fallback(NotFoundPage)
    const router = build()
    await router.push('/items/not-a-uuid')
    expect(router.currentRoute.value.name).toBe('NotFound')
    await router.push('/items/123e4567-e89b-12d3-a456-426614174000')
    expect(router.currentRoute.value.name).toBe('items.show')
  })

  it('whereUlid accepts a ulid and rejects a malformed token', async () => {
    Route.get('orders/{ref}', Page).whereUlid('ref').name('orders.show')
    Route.fallback(NotFoundPage)
    const router = build()
    await router.push('/orders/nope')
    expect(router.currentRoute.value.name).toBe('NotFound')
    await router.push('/orders/01ARZ3NDEKTSV4RRFFQ69G5FAV')
    expect(router.currentRoute.value.name).toBe('orders.show')
  })

  it('whereIn only matches the enumerated literals ("movies" is not "movie")', async () => {
    Route.get('media/{type}', Page).whereIn('type', ['movie', 'song']).name('media.show')
    Route.fallback(NotFoundPage)
    const router = build()
    await router.push('/media/movies')
    expect(router.currentRoute.value.name).toBe('NotFound')
    await router.push('/media/song')
    expect(router.currentRoute.value.name).toBe('media.show')
  })

  it('a global Route.pattern() gates matching too', async () => {
    Route.get('g/{id}', Page).name('g.show')
    Route.fallback(NotFoundPage)
    Route.pattern('id', '[0-9]+')
    const router = build()
    await router.push('/g/ab')
    expect(router.currentRoute.value.name).toBe('NotFound')
    await router.push('/g/12')
    expect(router.currentRoute.value.name).toBe('g.show')
  })

  it('a group-level where() gates matching for enclosed routes', async () => {
    Route.where({ slug: '[a-z-]+' }).group(() => {
      Route.get('posts/{slug}', Page).name('posts.show')
    })
    Route.fallback(NotFoundPage)
    const router = build()
    await router.push('/posts/UPPER_case')
    expect(router.currentRoute.value.name).toBe('NotFound')
    await router.push('/posts/hello-world')
    expect(router.currentRoute.value.name).toBe('posts.show')
  })
})
