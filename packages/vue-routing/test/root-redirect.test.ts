import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter } from '@anil-labs/vue-routing'
import type { MiddlewareFn } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })

beforeEach(() => {
  Route.flush()
})

describe('root with two top-level layouts', () => {
  // When an app has a guest layout AND an app layout, both top-level wrappers
  // share path '/'. The bare '/' must be redirected by a TOP-LEVEL redirect,
  // otherwise the first wrapper matches with no child and renders blank.
  it('resolves "/" through a top-level redirect across two layouts', async () => {
    const AuthLayout = stub('AuthLayout')
    const MainLayout = stub('MainLayout')
    const auth: MiddlewareFn = (to) => (to.name === 'dashboard' ? { name: 'login' } : true)

    Route.redirect('/', '/dashboard')
    Route.layout(AuthLayout).group(() => {
      Route.view('login', stub('Login')).name('login')
    })
    Route.middleware(auth)
      .layout(MainLayout)
      .group(() => {
        Route.view('dashboard', stub('Dashboard')).name('dashboard')
      })

    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })

    await router.push('/')
    // '/' → /dashboard → (auth) → /login, with a real matched component.
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.matched.length).toBeGreaterThan(0)
  })
})
