// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, type ComputedRef } from 'vue'
import type { Component } from 'vue'
import type { Router } from 'vue-router'
import { mount } from '@vue/test-utils'
import {
  Route,
  createAppRouter,
  useRouteName,
  useRouteAction,
  useIsRoute,
  useBoundModels,
  useSubdomainParams,
} from '@/lib'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

/** Mount a throwaway component within the router and capture a composable's ref. */
function read<T>(router: Router, useFn: () => ComputedRef<T>): ComputedRef<T> {
  let captured: ComputedRef<T> | undefined
  const Comp = defineComponent({
    setup() {
      captured = useFn()
      return () => h('div')
    },
  })
  mount(Comp, { global: { plugins: [router] } })
  if (!captured) throw new Error('composable did not run')
  return captured
}

beforeEach(() => {
  Route.flush()
  window.location.href = 'http://localhost/'
})

describe('useRouteName', () => {
  it('reflects the current route name', async () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/home')
    expect(read(router, useRouteName).value).toBe('home')
  })

  it('is undefined on an unnamed route', async () => {
    Route.get('anon', Page) // no .name()
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/anon')
    expect(read(router, useRouteName).value).toBeUndefined()
  })
})

describe('useRouteAction', () => {
  it('reports the resourceful action and updates on navigation', async () => {
    Route.resource('users', Page)
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/users')
    const action = read(router, useRouteAction)
    expect(action.value).toBe('index')
    await router.push('/users/1')
    expect(action.value).toBe('show')
  })
})

describe('useIsRoute', () => {
  it('matches exact names, wildcards, and multiple patterns', async () => {
    Route.resource('users', Page)
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/users')
    expect(read(router, () => useIsRoute('users.index')).value).toBe(true)
    expect(read(router, () => useIsRoute('users.*')).value).toBe(true)
    expect(read(router, () => useIsRoute('nope', 'users.index')).value).toBe(true)
    expect(read(router, () => useIsRoute('posts.*')).value).toBe(false)
  })
})

describe('useBoundModels', () => {
  it('exposes models resolved by bindings', async () => {
    Route.get('users/{user}', Page).name('users.show')
    Route.bind('user', () => ({ id: 1, name: 'Ada' }))
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      bindings: Route.getBindings(),
    })
    await router.push('/users/1')
    const models = read(router, () => useBoundModels<{ user: { id: number; name: string } }>())
    expect(models.value.user).toEqual({ id: 1, name: 'Ada' })
  })

  it('is an empty object when no bindings resolved', async () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/home')
    expect(read(router, () => useBoundModels()).value).toEqual({})
  })
})

describe('domain guard', () => {
  it('cancels navigation when the hostname does not match the route domain', async () => {
    window.location.href = 'https://evil.com/dashboard'
    Route.domain('{account}.example.com').group(() => {
      Route.view('secure', Page).name('secure')
    })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/secure').catch(() => undefined)
    expect(router.currentRoute.value.name).not.toBe('secure')
  })
})

describe('useSubdomainParams', () => {
  it('returns {} when the route has no domain', async () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/home')
    expect(read(router, useSubdomainParams).value).toEqual({})
  })

  it('captures params from the matching hostname', async () => {
    window.location.href = 'https://acme.example.com/dashboard'
    Route.domain('{account}.example.com').group(() => {
      Route.view('dashboard', Page).name('dashboard')
    })
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/dashboard')
    expect(read(router, useSubdomainParams).value).toEqual({ account: 'acme' })
  })
})
