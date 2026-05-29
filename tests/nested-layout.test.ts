import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { Route, createAppRouter } from '@/lib'

const stub = (name: string): Component => ({ name, render: () => null })

beforeEach(() => {
  Route.flush()
})

describe('nested layout with nested routing', () => {
  it('nests a layout inside a layout (MainLayout › SettingsLayout › page)', async () => {
    const MainLayout = stub('MainLayout')
    const SettingsLayout = stub('SettingsLayout')
    const Profile = stub('Profile')

    Route.layout(MainLayout).group(() => {
      Route.view('dashboard', stub('Dashboard')).name('dashboard')

      Route.redirect('settings', '/settings/profile')
      Route.layout(SettingsLayout)
        .prefix('settings')
        .asPrefix('settings')
        .group(() => {
          Route.view('profile', Profile).name('profile')
          Route.view('security', stub('Security')).name('security')
        })
    })

    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })

    // /settings/profile resolves through THREE matched records, in layout order.
    await router.push('/settings/profile')
    expect(router.currentRoute.value.name).toBe('settings.profile')
    const chain = router.currentRoute.value.matched.map((record) => record.components?.['default'])
    expect(chain).toEqual([MainLayout, SettingsLayout, Profile])

    // The sibling tab is also nested 3 deep.
    await router.push('/settings/security')
    expect(router.currentRoute.value.name).toBe('settings.security')
    expect(router.currentRoute.value.matched).toHaveLength(3)

    // /settings redirects to the default child.
    await router.push('/settings')
    expect(router.currentRoute.value.path).toBe('/settings/profile')

    // A non-settings route stays only two deep (MainLayout › page).
    await router.push('/dashboard')
    expect(router.currentRoute.value.matched).toHaveLength(2)
  })

  it('keeps "/" redirecting even when MainLayout has a nested-layout index child', async () => {
    // Mirrors the demo: a top-level root redirect, a guest layout, and a
    // protected layout that contains a nested SettingsLayout group.
    const AuthLayout = stub('AuthLayout')
    const MainLayout = stub('MainLayout')
    const SettingsLayout = stub('SettingsLayout')

    Route.redirect('/', '/dashboard')
    Route.layout(AuthLayout).group(() => {
      Route.view('login', stub('Login')).name('login')
    })
    Route.layout(MainLayout).group(() => {
      Route.view('dashboard', stub('Dashboard')).name('dashboard')
      Route.layout(SettingsLayout)
        .prefix('settings')
        .asPrefix('settings')
        .group(() => {
          Route.view('profile', stub('Profile')).name('profile')
        })
    })

    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})
