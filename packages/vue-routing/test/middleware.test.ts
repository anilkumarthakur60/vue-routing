import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter, collectMiddleware, runMiddleware } from '@anil-labs/vue-routing'
import type { MiddlewareFn } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

beforeEach(() => {
  Route.flush()
})

describe('group + route withoutMiddleware', () => {
  it('removes a group middleware for a single route (route-level)', () => {
    const a: MiddlewareFn = () => true
    const b: MiddlewareFn = () => true
    Route.middleware(a, b).group(() => {
      Route.get('x', Page).name('x').withoutMiddleware(a)
    })
    const meta = Route.getRoutes()[0]?.meta
    expect(meta?.middleware).toEqual([b])
    expect(meta?.excludedMiddleware).toEqual([a])
  })

  it('removes a middleware for a whole nested group (group-level)', () => {
    const log: MiddlewareFn = () => true
    const auth: MiddlewareFn = () => true
    Route.middleware(log, auth).group(() => {
      Route.get('dash', Page).name('dash')
      Route.withoutMiddleware(auth).group(() => {
        Route.get('public', Page).name('public')
      })
    })
    const mwCount = (name: string): number => {
      const record = Route.getRoutes().find((r) => r.name === name)
      return (record?.meta?.middleware ?? []).length
    }
    expect(mwCount('dash')).toBe(2) // log + auth
    expect(mwCount('public')).toBe(1) // log only
  })
})

describe('collectMiddleware', () => {
  it('de-duplicates and preserves order across matched records', async () => {
    const order: string[] = []
    const log: MiddlewareFn = () => {
      order.push('log')
      return true
    }
    const auth: MiddlewareFn = () => {
      order.push('auth')
      return true
    }
    Route.middleware(log, auth).group(() => {
      Route.view('home', Page).middleware(log).name('home') // log added twice
    })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/home')
    expect(order).toEqual(['log', 'auth']) // log not run twice
  })
})

describe('async middleware (audit test gap: async pipeline + throwing guards)', () => {
  it('awaits async middleware in order and short-circuits on redirect', async () => {
    const order: string[] = []
    const first: MiddlewareFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
      order.push('first')
      return { name: 'login' }
    }
    const second: MiddlewareFn = () => {
      order.push('second')
      return true
    }
    Route.middleware(first, second).group(() => {
      Route.view('secret', Page).name('secret')
    })
    Route.view('login', Page).name('login')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/secret')
    expect(router.currentRoute.value.name).toBe('login')
    expect(order).toEqual(['first']) // second never ran
  })

  it('fully awaits async middleware before binding resolution starts', async () => {
    const order: string[] = []
    const slow: MiddlewareFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
      order.push('middleware')
      return true
    }
    Route.middleware(slow).group(() => {
      Route.get('users/{user}', Page).name('users.show')
    })
    Route.bind('user', () => {
      order.push('binding')
      return { id: 1 }
    })
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      bindings: Route.getBindings(),
    })
    await router.push('/users/1')
    expect(order).toEqual(['middleware', 'binding'])
  })

  it('propagates a throwing middleware as a navigation error', async () => {
    const boom: MiddlewareFn = () => {
      throw new Error('middleware exploded')
    }
    Route.view('home', Page).name('home')
    Route.middleware(boom).group(() => {
      Route.view('danger', Page).name('danger')
    })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/home')
    await expect(router.push('/danger')).rejects.toThrow('middleware exploded')
    expect(router.currentRoute.value.name).toBe('home')
  })
})

describe('middleware cancel-with-false (audit test gap: end-to-end cancel)', () => {
  it('cancels navigation and keeps the current route', async () => {
    const block: MiddlewareFn = () => false
    Route.view('home', Page).name('home')
    Route.middleware(block).group(() => {
      Route.view('blocked', Page).name('blocked')
    })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/home')
    await router.push('/blocked').catch(() => undefined)
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.path).toBe('/home')
  })
})

describe('runMiddleware', () => {
  const to = {} as never
  const from = {} as never

  it('returns undefined when every middleware passes', async () => {
    expect(await runMiddleware([() => true, () => undefined], to, from)).toBeUndefined()
  })

  it('short-circuits on the first redirect/cancel result', async () => {
    const calls: string[] = []
    const result = await runMiddleware(
      [
        () => {
          calls.push('a')
          return { name: 'login' }
        },
        () => {
          calls.push('b')
          return true
        },
      ],
      to,
      from,
    )
    expect(result).toEqual({ name: 'login' })
    expect(calls).toEqual(['a']) // second never ran
  })

  it('exposes collectMiddleware as the chain builder', () => {
    expect(typeof collectMiddleware).toBe('function')
  })
})
