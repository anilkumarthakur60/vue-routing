---
layout: home
hero:
  name: '@anil-labs/vue-routing'
  text: Laravel-inspired routing for Vue 3
  tagline: A fluent, fully-typed wrapper over vue-router — groups, layouts, middleware, resources, constraints, named routes, and model binding.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/
features:
  - title: Fluent & declarative
    details: Define routes the way Laravel does — Route.middleware(auth).layout(MainLayout).group(...). The vue-router tree is built for you.
  - title: Fully typed, zero any
    details: Strict TypeScript throughout, 100% test coverage. The package augments vue-router's RouteMeta, so route metadata is typed everywhere — including your app.
  - title: Middleware & nested layouts
    details: Group-level and per-route middleware that auto-merge across matched records (with withoutMiddleware), plus multi-level layout nesting.
  - title: Resources & constraints
    details: One call for resource() (index/create/show/edit), nested and singleton resources, plus whereNumber/whereUuid/whereIn and global patterns.
  - title: Model binding
    details: Resolve route params to models before the page loads with Route.bind(), with scoped bindings and a missing() fallback — exposed via useBoundModels().
  - title: URL generation & subdomains
    details: Laravel-style route() URL generation with defaults(), subdomain routing via domain(), and reactive composables for route state.
---
