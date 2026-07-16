import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { Route, createAppRouter, compileUrl } from '@/lib'
import type { MiddlewareFn } from '@/lib'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')
const Layout = stub('Layout')

const find = (name: string): RouteRecordRaw | undefined =>
  Route.getRoutes().find((r) => r.name === name)

beforeEach(() => {
  Route.flush()
})

describe('Router facade — full attribute surface', () => {
  it('exposes every constraint builder', () => {
    Route.whereNumber('n').group(() => Route.get('n/{n}', Page).name('rn'))
    Route.whereAlpha('a').group(() => Route.get('a/{a}', Page).name('ra'))
    Route.whereAlphaNumeric('b').group(() => Route.get('b/{b}', Page).name('rb'))
    Route.whereUuid('c').group(() => Route.get('c/{c}', Page).name('rc'))
    Route.whereUlid('d').group(() => Route.get('d/{d}', Page).name('rd'))
    Route.whereIn('e', ['x', 'y']).group(() => Route.get('e/{e}', Page).name('re'))
    const paths = Route.toList().map((r) => r.path)
    expect(paths).toContain('/e/:e(x|y)')
    expect(paths.some((p) => p.startsWith('/a/:a('))).toBe(true)
  })

  it('exposes domain, component(layout alias), scope, missing, and name aliases', () => {
    Route.domain('{t}.example.com').group(() => Route.get('h', Page).name('rh'))
    expect(find('rh')?.meta?.domain).toBe('{t}.example.com')

    Route.component(Layout).group(() => Route.view('w', Page).name('rw'))
    const wrapper = Route.getRoutes().find((r) => r.path === '/')
    expect(wrapper?.children?.some((c) => c.name === 'rw')).toBe(true)

    Route.scopeBindings().group(() => Route.get('s', Page).name('rs'))
    expect(find('rs')?.meta?.scopeBindings).toBe(true)

    Route.withoutScopedBindings().group(() => Route.get('ws', Page).name('rws'))
    expect(find('rws')?.meta?.withoutScopedBindings).toBe(true)

    const handler = (): { name: string } => ({ name: 'rh' })
    Route.missing(handler).group(() => Route.get('m', Page).name('rm'))
    expect(find('rm')?.meta?.missing).toBe(handler)

    Route.asPrefix('grp')
      .name('more')
      .group(() => Route.get('n', Page).name('leaf'))
    expect(find('grp.more.leaf')).toBeDefined()
  })

  it('supports model() alias and the list() console output', () => {
    Route.model('thing', () => null)
    expect(Route.getBindings().has('thing')).toBe(true)

    const spy = vi.spyOn(console, 'table').mockImplementation(() => undefined)
    Route.get('a', Page).name('a')
    Route.list()
    Route.list({ path: '/a' })
    expect(spy).toHaveBeenCalledTimes(2)
    spy.mockRestore()
  })
})

describe('group() options overload + required-callback guard', () => {
  it('accepts the plain callback form', () => {
    Route.group(() => {
      Route.get('plain', Page).name('plain')
    })
    expect(find('plain')?.path).toBe('/plain')
  })

  it('accepts an options object form', () => {
    const mw: MiddlewareFn = () => true
    Route.group({ prefix: 'api', namePrefix: 'api', middleware: [mw] }, () => {
      Route.get('ping', Page).name('ping')
    })
    expect(find('api.ping')?.path).toBe('/api/ping')
    expect(find('api.ping')?.meta?.middleware).toContain(mw)
  })

  it('throws when options are passed without a callback (facade and registrar)', () => {
    const facadeGroup = Route.group.bind(Route) as (o: unknown) => void
    expect(() => {
      facadeGroup({ prefix: 'x' })
    }).toThrow(/callback is required/)
    const registrar = Route.prefix('y')
    const registrarGroup = registrar.group.bind(registrar) as (o: unknown) => void
    expect(() => {
      registrarGroup({ prefix: 'z' })
    }).toThrow(/callback is required/)
  })
})

describe('RouteDefinition aliases', () => {
  it('as() aliases name(); scopeBindings() sets meta', () => {
    Route.get('a', Page).as('alpha')
    expect(Route.has('alpha')).toBe(true)
    Route.get('b', Page).scopeBindings().name('beta')
    expect(find('beta')?.meta?.scopeBindings).toBe(true)
  })
})

describe('record-factory — middleware/missing on redirect & fallback', () => {
  const log = function log(): boolean {
    return true
  }
  const trace = function trace(): boolean {
    return true
  }

  it('carries (filtered) middleware + exclusions onto a redirect', () => {
    Route.middleware(log, trace)
      .withoutMiddleware(trace)
      .group(() => {
        Route.redirect('old', '/new')
      })
    const redirect = Route.getRoutes().find((r) => r.path === '/old')
    expect(redirect?.meta?.middleware).toEqual([log])
    expect(redirect?.meta?.excludedMiddleware).toEqual([trace])
  })

  it('carries middleware, exclusions, and missing onto the fallback', () => {
    const handler = (): { name: string } => ({ name: 'x' })
    Route.middleware(log, trace)
      .withoutMiddleware(trace)
      .missing(handler)
      .group(() => {
        Route.fallback(Page)
      })
    const fallback = find('NotFound')
    expect(fallback?.meta?.middleware).toEqual([log])
    expect(fallback?.meta?.excludedMiddleware).toEqual([trace])
    expect(fallback?.meta?.missing).toBe(handler)
  })
})

describe('view() static props', () => {
  it('replaces props:true with a static props factory', () => {
    Route.view('about', Page, { version: '1.0' }).name('about')
    const record = find('about') as { props?: () => unknown }
    expect(typeof record.props).toBe('function')
    expect(record.props?.()).toEqual({ version: '1.0' })
  })
})

describe('route table middleware rendering', () => {
  it('names middleware and falls back to "anonymous"', () => {
    const named = function auth(): boolean {
      return true
    }
    Route.middleware(named, () => true).group(() => Route.get('x', Page).name('x'))
    const row = Route.toList().find((r) => r.name === 'x')
    expect(row?.middleware).toContain('auth')
    expect(row?.middleware).toContain('anonymous')
  })
})

describe('compileUrl edge case', () => {
  it('collapses an all-optional pattern to root', () => {
    expect(compileUrl(':x?', {})).toBe('/')
  })
})

describe('runtime guard branches', () => {
  it('skips group-excluded middleware during navigation', async () => {
    const ran: string[] = []
    const log: MiddlewareFn = () => {
      ran.push('log')
      return true
    }
    const auth: MiddlewareFn = () => {
      ran.push('auth')
      return true
    }
    Route.middleware(log, auth).group(() => {
      Route.withoutMiddleware(auth).group(() => {
        Route.view('public', Page).name('public')
      })
    })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/public')
    expect(ran).toEqual(['log'])
  })

  it('proceeds when the bindings map is present but empty', async () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      bindings: Route.getBindings(),
    })
    await router.push('/home')
    expect(router.currentRoute.value.name).toBe('home')
  })
})
