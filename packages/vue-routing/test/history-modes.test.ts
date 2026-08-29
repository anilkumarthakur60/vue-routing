// @vitest-environment happy-dom
/**
 * History-mode wiring (audit test gap: every other router-driving test uses
 * historyMode 'memory', so 'history', 'hash', the default mode, `base`, and a
 * custom scrollBehavior were never executed).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import type { RouterScrollBehavior } from 'vue-router'
import { Route, createAppRouter } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })
const Page = stub('Page')

beforeEach(() => {
  Route.flush()
  // Reset the URL between tests  history-backed routers mutate it.
  window.history.replaceState(null, '', '/')
})

describe('createAppRouter  history modes', () => {
  it('defaults to web history at the root base', async () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({ routes: Route.getRoutes() })
    expect(router.options.history.base).toBe('')
    await router.push('/home')
    expect(router.currentRoute.value.name).toBe('home')
    expect(window.location.pathname).toBe('/home')
  })

  it('hash mode drives window.location.hash', async () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'hash' })
    expect(router.options.history.base).toContain('#')
    await router.push('/home')
    expect(router.currentRoute.value.name).toBe('home')
    expect(window.location.hash).toBe('#/home')
  })

  it('applies a custom base in history mode', async () => {
    Route.view('home', Page).name('home')
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'history',
      base: '/app',
    })
    expect(router.options.history.base).toBe('/app')
    await router.push('/home')
    expect(window.location.pathname).toBe('/app/home')
  })

  it('passes a custom scrollBehavior through to vue-router', () => {
    Route.view('home', Page).name('home')
    const scrollBehavior: RouterScrollBehavior = vi.fn(() => false as const)
    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      scrollBehavior,
    })
    expect(router.options.scrollBehavior).toBe(scrollBehavior)
  })
})
