/**
 * Deep group-attribute merge semantics (audit test gap: "group merge semantics
 * beyond 2 levels are untested — domain/where/missing overrides, sticky scope
 * flags, and excluded-middleware re-add").
 */
import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter } from '@anil-labs/vue-routing'
import type { MiddlewareFn, MissingHandler } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

beforeEach(() => {
  Route.flush()
})

describe('deep group attribute merging (3+ levels)', () => {
  it('inner domain, same-key where, and missing override outer levels', () => {
    const outerMissing: MissingHandler = () => undefined
    const innerMissing: MissingHandler = () => undefined
    Route.domain('a.x.com')
      .name('one')
      .where({ id: '[a-z]+' })
      .missing(outerMissing)
      .group(() => {
        Route.domain('b.x.com')
          .name('two')
          .where({ id: '[0-9]+' })
          .missing(innerMissing)
          .group(() => {
            Route.prefix('p')
              .name('three')
              .group(() => {
                Route.get('u/{id}', Page).name('leaf')
              })
          })
      })
    const record = Route.getRoutes()[0]
    expect(record?.name).toBe('one.two.three.leaf')
    expect(record?.path).toBe('/p/u/:id([0-9]+)')
    expect(record?.meta?.domain).toBe('b.x.com')
    expect(record?.meta?.where).toEqual({ id: '[0-9]+' })
    expect(record?.meta?.missing).toBe(innerMissing)
  })

  it('merges distinct where keys across levels while same keys win innermost', () => {
    Route.where({ a: '[0-9]+', b: '[a-z]+' }).group(() => {
      Route.where({ b: '[A-Z]+' }).group(() => {
        Route.get('x/{a}/{b}', Page).name('x')
      })
    })
    expect(Route.getRoutes()[0]?.path).toBe('/x/:a([0-9]+)/:b([A-Z]+)')
  })

  it('keeps scope flags sticky once set at any level', () => {
    Route.scopeBindings().group(() => {
      Route.withoutScopedBindings().group(() => {
        Route.get('s', Page).name('s')
      })
    })
    const meta = Route.getRoutes()[0]?.meta
    expect(meta?.scopeBindings).toBe(true)
    expect(meta?.withoutScopedBindings).toBe(true)
  })

  it('accumulates prefixes and name prefixes across three levels', () => {
    Route.prefix('a')
      .name('a')
      .group(() => {
        Route.prefix('b')
          .name('b')
          .group(() => {
            Route.prefix('c')
              .name('c')
              .group(() => {
                Route.get('leaf', Page).name('leaf')
              })
          })
      })
    const record = Route.getRoutes()[0]
    expect(record?.path).toBe('/a/b/c/leaf')
    expect(record?.name).toBe('a.b.c.leaf')
  })
})

describe('excluded-middleware re-add semantics', () => {
  it('keeps a middleware excluded even when a deeper group re-adds it', () => {
    const mw: MiddlewareFn = () => true
    Route.middleware(mw)
      .withoutMiddleware(mw)
      .group(() => {
        Route.middleware(mw).group(() => {
          Route.get('x', Page).name('x')
        })
      })
    const meta = Route.getRoutes()[0]?.meta
    expect(meta?.middleware).toEqual([])
    expect(meta?.excludedMiddleware).toEqual([mw])
  })

  it('never runs the re-added middleware at navigation time', async () => {
    const ran: string[] = []
    const audit: MiddlewareFn = () => {
      ran.push('audit')
      return true
    }
    Route.middleware(audit)
      .withoutMiddleware(audit)
      .group(() => {
        Route.middleware(audit).group(() => {
          Route.view('x', Page).name('x')
        })
      })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/x')
    expect(router.currentRoute.value.name).toBe('x')
    expect(ran).toEqual([])
  })
})
