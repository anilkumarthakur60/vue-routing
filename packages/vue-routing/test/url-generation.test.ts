import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route } from '@/lib'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

beforeEach(() => {
  Route.flush()
})

describe('Route.route()', () => {
  it('substitutes params and appends leftovers as a query string', () => {
    Route.get('users/{id}/posts/{post}', Page).name('users.posts.show')
    expect(Route.route('users.posts.show', { id: 1, post: 9 })).toBe('/users/1/posts/9')
    expect(Route.route('users.posts.show', { id: 1, post: 9, page: 2 })).toBe(
      '/users/1/posts/9?page=2',
    )
  })

  it('encodes param and query values', () => {
    Route.get('search/{q}', Page).name('search')
    expect(Route.route('search', { q: 'a b', tag: 'c&d' })).toBe('/search/a%20b?tag=c%26d')
  })

  it('drops optional params and strips inline regex', () => {
    Route.get('docs/{slug?}', Page).whereAlpha('slug').name('docs')
    expect(Route.route('docs')).toBe('/docs')
    expect(Route.route('docs', { slug: 'intro' })).toBe('/docs/intro')
  })

  it('throws for a missing required param or unknown route name', () => {
    Route.get('posts/{id}', Page).name('posts.show')
    expect(() => Route.route('posts.show')).toThrow(/Missing required parameter "id"/)
    expect(() => Route.route('nope')).toThrow(/not defined/)
  })
})

describe('defaults()', () => {
  it('fills omitted params from per-route defaults', () => {
    Route.get('{locale}/about', Page).defaults('locale', 'en').name('about')
    expect(Route.route('about')).toBe('/en/about')
    expect(Route.route('about', { locale: 'fr' })).toBe('/fr/about')
  })

  it('accepts a map and merges repeated calls', () => {
    Route.get('{a}/{b}/x', Page).defaults({ a: '1' }).defaults('b', '2').name('x')
    expect(Route.route('x')).toBe('/1/2/x')
    expect(Route.route('x', { a: '9' })).toBe('/9/2/x')
  })
})

describe('Route.has()', () => {
  it('reports whether a named route exists', () => {
    Route.get('a', Page).name('alpha')
    expect(Route.has('alpha')).toBe(true)
    expect(Route.has('beta')).toBe(false)
  })

  it('throws on duplicate names', () => {
    Route.get('a', Page).name('dup')
    expect(() => Route.get('b', Page).name('dup')).toThrow(/already defined/)
  })
})
