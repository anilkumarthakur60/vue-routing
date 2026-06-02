import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import type { Component } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { Route, createAppRouter, createNavigationGuard, useSubdomainParams } from '@/lib'
import type { BindingResolver } from '@/lib'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

beforeEach(() => {
  Route.flush()
})

describe('no-window (SSR) guards', () => {
  it('the navigation guard skips domain validation when window is undefined', async () => {
    const guard = createNavigationGuard() as unknown as (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
    ) => Promise<unknown>
    const to = {
      matched: [{ meta: { domain: '{a}.example.com' } }],
      params: {},
      meta: {},
    } as unknown as RouteLocationNormalized
    // No window in the node test environment → checkDomains returns early and
    // navigation proceeds.
    expect(await guard(to, to)).toBe(true)
  })

  it('useSubdomainParams returns {} when window is undefined', async () => {
    Route.domain('{account}.example.com').group(() => {
      Route.view('dashboard', Page).name('dashboard')
    })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    const app = createApp({ render: () => null })
    app.use(router)
    await router.push('/dashboard')
    await router.isReady()
    const params = app.runWithContext(() => useSubdomainParams())
    expect(params.value).toEqual({})
  })

  it('binding resolution skips a param whose value is an empty array', async () => {
    const bindings = new Map<string, BindingResolver>([['x', () => ({ resolved: true })]])
    const guard = createNavigationGuard(bindings) as unknown as (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
    ) => Promise<unknown>
    const to = {
      matched: [],
      params: { x: [] as string[] },
      meta: {} as Record<string, unknown>,
    } as unknown as RouteLocationNormalized
    expect(await guard(to, to)).toBe(true)
    expect(to.meta.bound).toEqual({})
  })
})
