import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, patterns } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

const pathOf = (name: string): string | undefined =>
  Route.toList().find((row) => row.name === name)?.path

beforeEach(() => {
  Route.flush()
})

describe('per-route constraints', () => {
  it('applies each built-in whereX helper to the routing path', () => {
    Route.get('a/{id}', Page).whereNumber('id').name('a')
    Route.get('b/{slug}', Page).whereAlpha('slug').name('b')
    Route.get('c/{code}', Page).whereAlphaNumeric('code').name('c')
    Route.get('d/{uuid}', Page).whereUuid('uuid').name('d')
    Route.get('e/{ulid}', Page).whereUlid('ulid').name('e')
    Route.get('f/{type}', Page).whereIn('type', ['movie', 'song']).name('f')

    expect(pathOf('a')).toBe('/a/:id([0-9]+)')
    expect(pathOf('b')).toBe('/b/:slug([A-Za-z]+)')
    expect(pathOf('c')).toBe(`/c/:code(${patterns.alphaNumeric})`)
    expect(pathOf('d')).toBe(`/d/:uuid(${patterns.uuid})`)
    expect(pathOf('e')).toBe(`/e/:ulid(${patterns.ulid})`)
    expect(pathOf('f')).toBe('/f/:type(movie|song)')
  })
})

describe('group + facade constraints', () => {
  it('applies group-level whereUuid to enclosed routes', () => {
    Route.whereUuid('id').group(() => {
      Route.get('items/{id}', Page).name('items.show')
    })
    expect(Route.getRoutes()[0]?.meta?.where).toEqual({ id: patterns.uuid })
    expect(pathOf('items.show')).toBe(`/items/:id(${patterns.uuid})`)
  })

  it('exposes whereIn at the group level', () => {
    Route.whereIn('lang', ['en', 'fr']).group(() => {
      Route.get('{lang}/home', Page).name('home')
    })
    expect(pathOf('home')).toBe('/:lang(en|fr)/home')
  })
})

describe('global patterns', () => {
  it('applies a global pattern to every matching param', () => {
    Route.pattern('id', '[0-9]+')
    Route.get('users/{id}', Page).name('users.show')
    expect(pathOf('users.show')).toBe('/users/:id([0-9]+)')
  })

  it('lets a per-route where win over a global pattern when set via group/where', () => {
    // Per-route `where` given at registration is merged ahead of the global
    // pattern (per-route precedence) within a single application pass.
    Route.patterns({ id: '[0-9]+' })
    Route.where({ id: '[A-Z]+' }).group(() => {
      Route.get('codes/{id}', Page).name('codes.show')
    })
    expect(pathOf('codes.show')).toBe('/codes/:id([A-Z]+)')
  })

  it('does not double-apply when an inline regex already exists', () => {
    Route.get('x/{id}', Page).whereNumber('id').whereNumber('id').name('x')
    expect(pathOf('x')).toBe('/x/:id([0-9]+)')
  })
})
