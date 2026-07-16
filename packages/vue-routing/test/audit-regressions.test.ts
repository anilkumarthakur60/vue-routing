/**
 * Regression tests for the 4-lens audit fixes. One describe block per finding,
 * named so each is traceable back to the audit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import {
  Route,
  createAppRouter,
  createNavigationGuard,
  createRouteFacade,
} from '@anil-labs/vue-routing'
import type { MiddlewareFn } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

/** name → path map of all registered routes. */
function routeMap(): Record<string, string> {
  return Object.fromEntries(Route.toList().map((row) => [row.name, row.path]))
}

beforeEach(() => {
  Route.flush()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('group attribute merging (options object merges instead of replacing)', () => {
  it('concatenates chained middleware with options middleware', () => {
    const auth: MiddlewareFn = () => true
    const extra: MiddlewareFn = () => true
    Route.middleware(auth).group({ middleware: [extra] }, () => {
      Route.get('panel', Page).name('panel')
    })
    expect(Route.getRoutes()[0]?.meta?.middleware).toEqual([auth, extra])
  })

  it('does not let an empty options middleware array drop chained middleware', () => {
    const auth: MiddlewareFn = () => true
    Route.middleware(auth).group({ middleware: [] }, () => {
      Route.get('secure', Page).name('secure')
    })
    expect(Route.getRoutes()[0]?.meta?.middleware).toEqual([auth])
  })

  it('joins chained prefix with options prefix', () => {
    Route.prefix('admin').group({ prefix: 'reports' }, () => {
      Route.get('daily', Page).name('daily')
    })
    expect(Route.getRoutes()[0]?.path).toBe('/admin/reports/daily')
  })

  it('appends name prefixes and merges where maps', () => {
    Route.name('admin')
      .where({ id: '[0-9]+' })
      .group({ namePrefix: 'reports', where: { slug: '[a-z]+' } }, () => {
        Route.get('r/{id}/{slug}', Page).name('row')
      })
    const record = Route.getRoutes()[0]
    expect(record?.name).toBe('admin.reports.row')
    expect(record?.path).toBe('/r/:id([0-9]+)/:slug([a-z]+)')
  })
})

describe('route facade re-evaluation (createRouteFacade + idempotent name registry)', () => {
  it('createRouteFacade() returns isolated facades', () => {
    const first = createRouteFacade()
    const second = createRouteFacade()
    first.get('a', Page).name('alpha')
    expect(first.has('alpha')).toBe(true)
    expect(second.has('alpha')).toBe(false)
    expect(Route.has('alpha')).toBe(false)
  })

  it('re-registering the identical (name, path) pair replaces with a dev warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const registerRoutes = (): void => {
      Route.get('home', Page).name('home')
    }
    registerRoutes()
    // Simulate a routes module being re-evaluated (Vite SSR dev / HMR / tests).
    expect(registerRoutes).not.toThrow()
    expect(Route.has('home')).toBe(true)
    expect(Route.route('home')).toBe('/home')
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('still throws on a true collision (same name, different path)', () => {
    Route.get('a', Page).name('dup')
    expect(() => Route.get('b', Page).name('dup')).toThrow(/already defined/)
  })
})

describe('renaming a route (no stale alias left in the registry)', () => {
  it('unregisters the previous name on rename', () => {
    const definition = Route.get('u', Page).name('first').name('second')
    expect(Route.has('first')).toBe(false)
    expect(Route.has('second')).toBe(true)
    expect(() => Route.route('first')).toThrow(/not defined/)
    expect(Route.route('second')).toBe('/u')
    expect(definition.record.name).toBe('second')
  })

  it('naming the same route twice with the same value is a no-op', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    Route.get('x', Page).name('same').name('same')
    expect(Route.has('same')).toBe(true)
    expect(warn).not.toHaveBeenCalled()
  })

  it("renaming the fallback removes the auto-registered 'NotFound' entry", () => {
    Route.fallback(Page).name('custom404')
    expect(Route.has('NotFound')).toBe(false)
    expect(Route.has('custom404')).toBe(true)
    expect(Route.getRoutes()[0]?.name).toBe('custom404')
  })
})

describe('getRoutes() defensive copy (no live internal array exposure)', () => {
  it('a captured array is unaffected by flush() and later registrations', () => {
    Route.get('one', Page).name('one')
    const captured = Route.getRoutes()
    expect(captured).toHaveLength(1)

    Route.get('two', Page).name('two')
    expect(captured).toHaveLength(1)

    Route.flush()
    expect(captured).toHaveLength(1)
    expect(captured[0]?.path).toBe('/one')
  })

  it('mutating the returned array does not corrupt the registry', () => {
    Route.get('keep', Page).name('keep')
    Route.getRoutes().length = 0
    expect(Route.getRoutes()).toHaveLength(1)
  })
})

describe('re-constraining parameters (last-write-wins keeps path and meta in sync)', () => {
  it('a later where() replaces an earlier constraint on the path too', () => {
    Route.get('user/{id}', Page).whereNumber('id').where({ id: '[a-z]+' }).name('user')
    const record = Route.getRoutes()[0]
    expect(record?.path).toBe('/user/:id([a-z]+)')
    expect(record?.meta?.where).toEqual({ id: '[a-z]+' })
  })

  it('per-route where() overrides a group-level constraint', () => {
    Route.whereNumber('id').group(() => {
      Route.get('items/{id}', Page).where({ id: '[a-z]+' }).name('items.show')
    })
    expect(Route.getRoutes()[0]?.path).toBe('/items/:id([a-z]+)')
  })

  it('inline regex written directly in the URI keeps precedence', () => {
    Route.get('files/:path([a-z]+)', Page).where({ path: '[0-9]+' }).name('files')
    expect(Route.getRoutes()[0]?.path).toBe('/files/:path([a-z]+)')
  })
})

describe('resource registration chaining (deferred pending registration)', () => {
  it('applies .only() and .middleware() chained after resource()', () => {
    const auth: MiddlewareFn = () => true
    Route.resource('users', Page).only('index', 'show').middleware(auth)
    const map = routeMap()
    expect(Object.keys(map).sort()).toEqual(['users.index', 'users.show'])
    for (const record of Route.getRoutes()) {
      expect(record.meta?.middleware).toContain(auth)
    }
  })

  it('applies .except(), .names() and .parameters()', () => {
    Route.resource('photos', Page)
      .except('create', 'edit')
      .names('images')
      .parameters({ photos: 'img' })
    const map = routeMap()
    expect(map['images.index']).toBe('/photos')
    expect(map['images.show']).toBe('/photos/:img')
    expect(Object.keys(map)).toHaveLength(2)
  })

  it('supports singleton().creatable() chaining', () => {
    Route.singleton('profile', Page).creatable()
    const map = routeMap()
    expect(map['profile.create']).toBe('/profile/create')
    expect(map['profile.show']).toBe('/profile')
    expect(map['profile.edit']).toBe('/profile/edit')
  })

  it('fans out resources() chaining to every resource', () => {
    const auth: MiddlewareFn = () => true
    Route.resources({ photos: Page, videos: Page }).only('index').middleware(auth)
    const rows = Route.toList()
    expect(rows.map((row) => row.name)).toEqual(['photos.index', 'videos.index'])
    for (const record of Route.getRoutes()) {
      expect(record.meta?.middleware).toContain(auth)
    }
  })

  it('commits pendings in declaration order, before later routes', () => {
    Route.resource('aaa', Page).only('index')
    Route.get('zzz', Page).name('zzz')
    expect(Route.toList().map((row) => row.name)).toEqual(['aaa.index', 'zzz'])
  })

  it('commits inside the group context where the resource was declared', () => {
    Route.prefix('admin')
      .asPrefix('admin')
      .group(() => {
        Route.resource('posts', Page).only('index')
      })
    Route.get('other', Page).name('other')
    expect(routeMap()['admin.posts.index']).toBe('/admin/posts')
  })

  it('resolves names registered by a pending resource through has()/route()', () => {
    Route.resource('users', Page)
    expect(Route.has('users.show')).toBe(true)
    expect(Route.route('users.show', { user: 7 })).toBe('/users/7')
  })

  it('throws when chaining after the registration has been committed', () => {
    const pending = Route.resource('users', Page)
    Route.toList()
    expect(() => pending.only('index')).toThrow(/already been committed/)
  })
})

describe('global patterns applied lazily (pattern() after routes still applies)', () => {
  it('constrains routes that were registered before the pattern was defined', () => {
    Route.get('users/{id}', Page).name('users.show')
    Route.pattern('id', '[0-9]+')
    expect(Route.getRoutes()[0]?.path).toBe('/users/:id([0-9]+)')
    expect(Route.toList()[0]?.path).toBe('/users/:id([0-9]+)')
  })

  it('keeps per-route where() precedence over a later global pattern', () => {
    Route.get('codes/{id}', Page).where({ id: '[A-Z]+' }).name('codes.show')
    Route.pattern('id', '[0-9]+')
    expect(Route.getRoutes()[0]?.path).toBe('/codes/:id([A-Z]+)')
  })

  it('applies late patterns to layout children too', () => {
    const Layout = stub('Layout')
    Route.layout(Layout).group(() => {
      Route.get('posts/{id}', Page).name('posts.show')
    })
    Route.pattern('id', '\\d+')
    const wrapper = Route.getRoutes()[0] as { children?: { path: string }[] }
    expect(wrapper.children?.[0]?.path).toBe('posts/:id(\\d+)')
  })
})

describe('whereIn regex escaping (values match literally)', () => {
  it('escapes metacharacters in per-route whereIn()', () => {
    Route.get('file/{ext}', Page).whereIn('ext', ['a.b', 'txt']).name('file')
    expect(Route.getRoutes()[0]?.path).toBe('/file/:ext(a\\.b|txt)')
  })

  it('escapes metacharacters in group-level whereIn()', () => {
    Route.whereIn('ext', ['c+d', 'e|f']).group(() => {
      Route.get('dl/{ext}', Page).name('dl')
    })
    expect(Route.getRoutes()[0]?.path).toBe('/dl/:ext(c\\+d|e\\|f)')
  })
})

describe('async group callback rejection (attributes must not silently pop early)', () => {
  it('throws when the group callback returns a promise', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- the trap under test
      Route.prefix('admin').group(async () => {
        await Promise.resolve()
      })
    }).toThrow(/synchronous/)
  })
})

describe('URL generation defaults and domain params (no query-string leakage)', () => {
  it('does not leak a non-path default into the query string', () => {
    Route.get('about', Page).defaults('locale', 'en').name('about')
    expect(Route.route('about')).toBe('/about')
  })

  it('still fills path params from defaults', () => {
    Route.get('{locale}/about', Page).defaults('locale', 'en').name('about')
    expect(Route.route('about')).toBe('/en/about')
    expect(Route.route('about', { locale: 'fr' })).toBe('/fr/about')
  })

  it('fills the host with supplied domain params instead of leaking them into the query', () => {
    Route.domain('{account}.example.com').group(() => {
      Route.get('dash', Page).name('dash')
    })
    expect(Route.route('dash', { account: 'acme' })).toBe('//acme.example.com/dash')
  })

  it('falls back to a relative URL when domain params are not supplied', () => {
    Route.domain('{account}.example.com').group(() => {
      Route.get('dash', Page).name('dash')
    })
    expect(Route.route('dash')).toBe('/dash')
  })

  it('keeps a static domain relative (no params to fill)', () => {
    Route.domain('admin.example.com').group(() => {
      Route.get('panel', Page).name('panel')
    })
    expect(Route.route('panel')).toBe('/panel')
  })

  it('fills a domain param from the route defaults', () => {
    Route.domain('{account}.example.com').group(() => {
      Route.get('billing', Page).defaults('account', 'acme').name('billing')
    })
    expect(Route.route('billing')).toBe('//acme.example.com/billing')
  })

  it('uses a param that appears in both domain and path in both places', () => {
    Route.domain('{account}.example.com').group(() => {
      Route.get('t/{account}', Page).name('tenant')
    })
    expect(Route.route('tenant', { account: 'acme' })).toBe('//acme.example.com/t/acme')
  })
})

describe('redirect() target param substitution', () => {
  it('keeps a static target as a plain string redirect', () => {
    Route.redirect('here', '/there')
    expect(Route.getRoutes()[0]).toMatchObject({ path: '/here', redirect: '/there' })
  })

  it('substitutes shared params into the redirect target', async () => {
    Route.redirect('old/{id}', '/new/{id}')
    Route.get('new/{id}', Page).name('new.show')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/old/42')
    expect(router.currentRoute.value.fullPath).toBe('/new/42')
    expect(router.currentRoute.value.name).toBe('new.show')
  })

  it('does not leak unshared source params into the target', async () => {
    Route.redirect('old/{a}/{b}', '/new/{a}')
    Route.get('new/{a}', Page).name('n')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/old/1/2')
    expect(router.currentRoute.value.fullPath).toBe('/new/1')
  })
})

describe('redirect() middleware and where() enforcement', () => {
  it('bakes group where() constraints into the redirect path', () => {
    Route.whereNumber('id').group(() => {
      Route.redirect('old/{id}', '/new')
    })
    expect(Route.getRoutes()[0]?.path).toBe('/old/:id([0-9]+)')
  })

  it('runs group middleware before redirecting', async () => {
    const ran: string[] = []
    const audit: MiddlewareFn = () => {
      ran.push('audit')
      return true
    }
    Route.middleware(audit).group(() => {
      Route.redirect('old', '/new')
    })
    Route.view('new', Page).name('target')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/old')
    expect(ran).toEqual(['audit'])
    expect(router.currentRoute.value.name).toBe('target')
  })

  it('lets middleware divert the navigation before the redirect happens', async () => {
    const deny: MiddlewareFn = () => ({ name: 'login' })
    Route.middleware(deny).group(() => {
      Route.redirect('old', '/new')
    })
    Route.view('new', Page).name('target')
    Route.view('login', Page).name('login')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/old')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('substitutes params on a middleware-carrying redirect too', async () => {
    const pass: MiddlewareFn = () => true
    Route.middleware(pass).group(() => {
      Route.redirect('old/{id}', '/new/{id}')
    })
    Route.get('new/{id}', Page).name('n')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/old/7')
    expect(router.currentRoute.value.fullPath).toBe('/new/7')
  })
})

describe('same path under two domains (creation-time domain filtering)', () => {
  const PageA = stub('PageA')
  const PageB = stub('PageB')

  const registerBoth = (): void => {
    Route.domain('a.example.com').group(() => {
      Route.view('dash', PageA).name('dash.a')
    })
    Route.domain('b.example.com').group(() => {
      Route.view('dash', PageB).name('dash.b')
    })
  }

  it('matches the record whose domain fits the provided hostname', async () => {
    registerBoth()
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      hostname: 'b.example.com',
    })
    await router.push('/dash')
    expect(router.currentRoute.value.name).toBe('dash.b')
  })

  it('matches hostnames case-insensitively', async () => {
    registerBoth()
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      hostname: 'A.EXAMPLE.COM',
    })
    await router.push('/dash')
    expect(router.currentRoute.value.name).toBe('dash.a')
  })

  it('keeps domain-less routes for every hostname', async () => {
    registerBoth()
    Route.view('open', Page).name('open')
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      hostname: 'b.example.com',
    })
    await router.push('/open')
    expect(router.currentRoute.value.name).toBe('open')
  })

  it('filters domain-bound children nested under layout wrappers', async () => {
    const Layout = stub('Layout')
    Route.layout(Layout).group(() => {
      Route.domain('a.example.com').group(() => {
        Route.view('dash', PageA).name('dash.a')
      })
      Route.domain('b.example.com').group(() => {
        Route.view('dash', PageB).name('dash.b')
      })
    })
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      hostname: 'b.example.com',
    })
    await router.push('/dash')
    expect(router.currentRoute.value.name).toBe('dash.b')
  })
})

describe('SSR domain validation with an explicit hostname', () => {
  type GuardFn = (to: unknown, from: unknown) => Promise<unknown>

  const location = (domain: string): unknown => ({
    matched: [{ meta: { domain } }],
    params: {},
    meta: {},
  })

  it('rejects a non-matching host even without window', async () => {
    const guard = createNavigationGuard(undefined, 'b.example.com') as unknown as GuardFn
    expect(await guard(location('a.example.com'), location('a.example.com'))).toBe(false)
  })

  it('allows a matching host without window', async () => {
    const guard = createNavigationGuard(undefined, 'a.example.com') as unknown as GuardFn
    expect(await guard(location('a.example.com'), location('a.example.com'))).toBe(true)
  })

  it('still skips validation when neither hostname nor window exist', async () => {
    const guard = createNavigationGuard() as unknown as GuardFn
    expect(await guard(location('a.example.com'), location('a.example.com'))).toBe(true)
  })
})

describe('group-prefix binding fields ({param:field} declared in a prefix)', () => {
  it('preserves binding fields declared in a group prefix', () => {
    Route.prefix('teams/{team:slug}').group(() => {
      Route.get('dashboard', Page).name('teams.dash')
    })
    const record = Route.getRoutes()[0]
    expect(record?.path).toBe('/teams/:team/dashboard')
    expect(record?.meta?.bindingFields).toEqual({ team: 'slug' })
  })

  it('merges prefix fields with leaf URI fields', () => {
    Route.prefix('teams/{team:slug}').group(() => {
      Route.get('posts/{post:uuid}', Page).name('tp')
    })
    expect(Route.getRoutes()[0]?.meta?.bindingFields).toEqual({ team: 'slug', post: 'uuid' })
  })

  it('hands the prefix-declared field to the binding resolver', async () => {
    Route.prefix('teams/{team:slug}').group(() => {
      Route.get('dashboard', Page).name('td')
    })
    const fields: (string | undefined)[] = []
    Route.bind('team', (value, _to, context) => {
      fields.push(context.field)
      return { value }
    })
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      bindings: Route.getBindings(),
    })
    await router.push('/teams/acme/dashboard')
    expect(fields).toEqual(['slug'])
  })
})

describe('scoped fallback() (group prefix applied, name derived from prefix)', () => {
  it('applies the group prefix to the fallback path and scopes its name', () => {
    Route.prefix('admin')
      .asPrefix('admin')
      .group(() => {
        Route.fallback(Page)
      })
    const record = Route.getRoutes()[0]
    expect(record?.path).toBe('/admin/:pathMatch(.*)*')
    expect(record?.name).toBe('admin.NotFound')
    expect(Route.has('admin.NotFound')).toBe(true)
  })

  it('lets a scoped fallback coexist with the global one', () => {
    Route.prefix('admin')
      .asPrefix('admin')
      .group(() => {
        Route.fallback(Page)
      })
    expect(() => Route.fallback(Page)).not.toThrow()
    expect(Route.has('admin.NotFound')).toBe(true)
    expect(Route.has('NotFound')).toBe(true)
  })

  it('routes an unmatched prefixed path to the scoped fallback', async () => {
    Route.view('home', Page).name('home')
    Route.prefix('admin')
      .asPrefix('admin')
      .group(() => {
        Route.fallback(Page)
      })
    Route.fallback(Page)
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/admin/nope')
    expect(router.currentRoute.value.name).toBe('admin.NotFound')
    await router.push('/junk')
    expect(router.currentRoute.value.name).toBe('NotFound')
  })
})

describe('default scrollBehavior (restores savedPosition)', () => {
  const loc = {} as RouteLocationNormalizedLoaded

  it('returns the saved position when present, otherwise top-left', () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    const behavior = router.options.scrollBehavior
    expect(behavior?.(loc, loc, { left: 3, top: 120 })).toEqual({ left: 3, top: 120 })
    expect(behavior?.(loc, loc, null)).toEqual({ left: 0, top: 0 })
  })
})
