import { beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { createAppRouter } from '@anil-labs/vue-routing'
import { Route } from '@anil-labs/vue-routing'
import type { MiddlewareFn } from '@anil-labs/vue-routing'

const stub = (name: string): Component => ({ name, render: () => null })

const Home = stub('Home')
const Login = stub('Login')
const Secret = stub('Secret')
const UserPage = stub('UserPage')

beforeEach(() => {
  Route.flush()
})

describe('createAppRouter  configuration', () => {
  it('builds a working router in memory history mode', () => {
    Route.view('home', Home).name('home')
    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    expect(typeof router.push).toBe('function')
    expect(typeof router.beforeEach).toBe('function')
  })

  it('runs the guard pipeline in order: middleware before binding resolution', async () => {
    const order: string[] = []
    const trace: MiddlewareFn = () => {
      order.push('middleware')
      return true
    }
    Route.middleware(trace).group(() => {
      Route.get('users/{user}', UserPage).name('users.show')
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
})

describe('createAppRouter  middleware pipeline', () => {
  it('runs middleware for matched routes', async () => {
    const visited: string[] = []
    const tracker: MiddlewareFn = (to) => {
      visited.push(to.path)
      return true
    }
    Route.middleware(tracker).group(() => {
      Route.view('home', Home).name('home')
    })

    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push('/home')

    expect(router.currentRoute.value.name).toBe('home')
    expect(visited).toContain('/home')
  })

  it('redirects when middleware returns a location', async () => {
    const guard: MiddlewareFn = (to) => (to.name === 'secret' ? { name: 'login' } : true)
    Route.middleware(guard).group(() => {
      Route.view('secret', Secret).name('secret')
    })
    Route.view('login', Login).name('login')

    const router = createAppRouter({ routes: Route.getRoutes(), historyMode: 'memory' })
    await router.push({ name: 'secret' })

    expect(router.currentRoute.value.name).toBe('login')
  })
})

describe('createAppRouter  model bindings', () => {
  it('resolves a bound model into meta.bound', async () => {
    Route.get('users/{id}', UserPage).name('users.show')
    Route.bind('id', (value) => (value === '1' ? { id: 1, name: 'Ada' } : null))

    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      bindings: Route.getBindings(),
    })
    await router.push('/users/1')

    expect(router.currentRoute.value.meta.bound).toEqual({ id: { id: 1, name: 'Ada' } })
  })

  it('cancels navigation when a binding cannot be resolved', async () => {
    Route.get('users/{id}', UserPage).name('users.show')
    Route.view('home', Home).name('home')
    Route.bind('id', (value) => (value === '1' ? { id: 1 } : null))

    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      bindings: Route.getBindings(),
    })
    await router.push('/home')
    await router.push('/users/1')
    expect(router.currentRoute.value.path).toBe('/users/1')

    await router.push('/users/999').catch(() => undefined)
    // Resolver returned null → navigation aborted, previous route retained.
    expect(router.currentRoute.value.path).toBe('/users/1')
  })

  it('runs the missing handler when provided', async () => {
    Route.get('users/{id}', UserPage)
      .name('users.show')
      .missing(() => ({ name: 'home' }))
    Route.view('home', Home).name('home')
    Route.bind('id', () => null)

    const router = createAppRouter({
      routes: Route.getRoutes(),
      historyMode: 'memory',
      bindings: Route.getBindings(),
    })
    await router.push('/users/5')

    expect(router.currentRoute.value.name).toBe('home')
  })
})
