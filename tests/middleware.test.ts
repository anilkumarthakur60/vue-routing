import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter, collectMiddleware, runMiddleware } from '@/lib'
import type { MiddlewareFn } from '@/lib'

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
