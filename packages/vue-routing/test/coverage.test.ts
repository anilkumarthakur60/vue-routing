import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import {
  Route,
  createAppRouter,
  compileUrl,
  extractBindingFields,
  extractParamNames,
} from '@anil-labs/vue-routing'
import type { MiddlewareFn } from '@anil-labs/vue-routing'
import { NameRegistry, RouteTree } from '@/registry'
import { matchDomain } from '@/path'

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

describe('toList(filterPath) output (audit test gap)', () => {
  it('filters rows by path prefix, using plain startsWith semantics', () => {
    Route.get('admin/x', Page).name('admin.x')
    Route.get('public/y', Page).name('public.y')
    Route.get('users', Page).name('users.index')
    expect(Route.toList('/admin').map((row) => row.path)).toEqual(['/admin/x'])
    // Plain prefix matching: '/user' also matches '/users'.
    expect(Route.toList('/user').map((row) => row.path)).toEqual(['/users'])
    expect(Route.toList('/nope')).toEqual([])
  })

  it('walks layout children with their full paths when filtering', () => {
    Route.layout(Layout).group(() => {
      Route.view('admin/panel', Page).name('admin.panel')
      Route.view('open', Page).name('open')
    })
    const rows = Route.toList('/admin')
    expect(rows.map((row) => [row.path, row.name])).toEqual([['/admin/panel', 'admin.panel']])
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
  type PropsFn = (route: { params: Record<string, unknown> }) => unknown

  it('merges route params with static props (static wins on conflict)', () => {
    Route.view('docs/{page}', Page, { version: '1.0' }).name('docs')
    const record = find('docs') as { props?: PropsFn }
    expect(typeof record.props).toBe('function')
    expect(record.props?.({ params: { page: 'intro' } })).toEqual({
      page: 'intro',
      version: '1.0',
    })
    expect(record.props?.({ params: { version: 'from-route' } })).toEqual({ version: '1.0' })
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

describe('RouteDefinition chains on redirect records (meta starts undefined)', () => {
  it('middleware() on a redirect starts from an empty chain', () => {
    const log: MiddlewareFn = () => true
    Route.redirect('a', '/b').middleware(log)
    expect(Route.getRoutes()[0]?.meta?.middleware).toEqual([log])
  })

  it('withoutMiddleware() on a bare redirect yields an empty chain', () => {
    const audit: MiddlewareFn = () => true
    Route.redirect('c', '/d').withoutMiddleware(audit)
    const record = Route.getRoutes()[0]
    expect(record?.meta?.middleware).toEqual([])
    expect(record?.meta?.excludedMiddleware).toEqual([audit])
  })

  it('where() on a redirect constrains its path from scratch', () => {
    Route.redirect('u/{id}', '/x').where({ id: '[0-9]+' })
    const record = Route.getRoutes()[0]
    expect(record?.path).toBe('/u/:id([0-9]+)')
    expect(record?.meta?.where).toEqual({ id: '[0-9]+' })
  })

  it('carries the group domain onto a redirect record', () => {
    Route.domain('a.example.com').group(() => {
      Route.redirect('old', '/new')
    })
    expect(Route.getRoutes()[0]?.meta?.domain).toBe('a.example.com')
  })

  it('the middleware-carrying redirect pass-through component renders nothing', () => {
    const pass: MiddlewareFn = () => true
    Route.middleware(pass).group(() => {
      Route.redirect('old', '/new')
    })
    const record = Route.getRoutes()[0] as { component?: { render?: () => unknown } }
    expect(record.component?.render?.()).toBeNull()
  })

  it('substitutes every segment of a repeatable source param into the target', async () => {
    Route.redirect('old/:rest(.*)*', '/new/{rest}')
    Route.get('new/:rest(.*)*', Page).name('n')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/old/a/b')
    // Catch-all redirects keep the whole tail — one encoded segment per element.
    expect(router.currentRoute.value.fullPath).toBe('/new/a/b')
  })
})

describe('RouteDefinition — remaining edge branches', () => {
  it('where() on a layout child keeps the relative path shape', () => {
    Route.layout(Layout).group(() => {
      Route.get('u/{id}', Page).where({ id: '[0-9]+' }).name('u')
    })
    const wrapper = Route.getRoutes()[0] as { children?: { path: string }[] }
    expect(wrapper.children?.[0]?.path).toBe('u/:id([0-9]+)')
  })

  it('defaults(key) without a value is ignored (guard branch)', () => {
    const definition = Route.get('{locale}/x', Page).defaults({ locale: 'en' }).name('x')
    const callWithoutValue = definition.defaults.bind(definition) as unknown as (
      key: string,
    ) => void
    callWithoutValue('locale')
    expect(Route.route('x')).toBe('/en/x')
  })
})

describe('route table rendering — placeholder cells', () => {
  it('renders "-" for unnamed routes and empty or absent middleware', () => {
    Route.get('anon', Page) // unnamed, middleware === []
    Route.redirect('from', '/to') // redirect meta carries no middleware key
    const rows = Route.toList()
    const anon = rows.find((row) => row.path === '/anon')
    expect(anon).toEqual({ path: '/anon', name: '-', middleware: '-' })
    const redirect = rows.find((row) => row.path === '/from')
    expect(redirect?.middleware).toBe('-')
  })
})

describe('re-registration warning is dev-only', () => {
  it('suppresses the identical re-registration warning in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      Route.get('home', Page).name('home')
      Route.get('home', Page).name('home')
      expect(Route.has('home')).toBe(true)
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
      vi.unstubAllEnvs()
    }
  })
})

describe('defensive branches unreachable through honest string inputs', () => {
  // The regex groups in these helpers are non-optional, so their undefined
  // guards (required by noUncheckedIndexedAccess) cannot fire for any real
  // string. Pin them with stand-in "strings" that produce malformed matches.
  it('param extractors skip a match whose groups are absent', () => {
    const fakePath = {
      matchAll: () => [[':x']].values(),
    } as unknown as string
    expect(extractBindingFields(fakePath)).toEqual({})
    expect(extractParamNames(fakePath)).toEqual([])
  })

  it('matchDomain skips a declared param the compiled regex did not capture', () => {
    const fakePattern = {
      // escapeRegExp() sees a token-free source (no capture groups)…
      replace: () => 'plain',
      // …while the declared-params list still announces one.
      matchAll: () => [['{a}', 'a']].values(),
    } as unknown as string
    expect(matchDomain(fakePattern, 'plain')).toEqual({})
  })

  it('NameRegistry.url treats an undeclared domain token as empty', () => {
    const registry = new NameRegistry()
    const fakeDomain = {
      matchAll: () => [['{a}', 'a']].values(),
      replace: (_pattern: RegExp, replacer: (match: string, token: string) => string): string =>
        `${replacer('{a}', 'a')}.${replacer('{ghost}', 'ghost')}.example.com`,
    } as unknown as string
    const record = { path: '/d', meta: { domain: fakeDomain } } as unknown as RouteRecordRaw
    registry.register('weird', { record, absolutePath: '/d' })
    expect(registry.url('weird', { a: 'acme' })).toBe('//acme..example.com/d')
  })

  it('RouteTree keeps an already-relative child path unchanged', () => {
    const tree = new RouteTree()
    const record = { path: 'already-relative', component: Page } as RouteRecordRaw
    tree.add(record, [Layout])
    const wrapper = tree.roots()[0] as { children?: { path: string }[] }
    expect(wrapper.children?.[0]?.path).toBe('already-relative')
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
