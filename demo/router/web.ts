/**
 * Route definitions for the demo — every feature of @anil-labs/vue-routing,
 * annotated with the capability it demonstrates.
 */
import { Route } from '@anil-labs/vue-routing'

// Layouts
import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import SettingsLayout from '../layouts/SettingsLayout.vue'

// Middleware
import auth from '../middleware/auth'
import guest from '../middleware/guest'
import log from '../middleware/log'

// Data resolvers for model binding
import { findUser } from '../data/users'
import { findArticle } from '../data/articles'

// Pages
import LoginPage from '../pages/LoginPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import AboutPage from '../pages/AboutPage.vue'
import DocPage from '../pages/DocPage.vue'
import OrderPage from '../pages/OrderPage.vue'
import ResourcePage from '../pages/ResourcePage.vue'
import RouteListPage from '../pages/RouteListPage.vue'
import ForbiddenPage from '../pages/ForbiddenPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'
import FeaturePage from '../pages/FeaturePage.vue'
import StatusPage from '../pages/StatusPage.vue'
import UsersIndex from '../pages/users/UsersIndex.vue'
import UserCreate from '../pages/users/UserCreate.vue'
import UserShow from '../pages/users/UserShow.vue'
import UserEdit from '../pages/users/UserEdit.vue'
import SettingsProfile from '../pages/settings/SettingsProfile.vue'
import SettingsSecurity from '../pages/settings/SettingsSecurity.vue'
import SettingsNotifications from '../pages/settings/SettingsNotifications.vue'

// ── Global parameter pattern ────────────────────────────────────────────────
// Every `{id}` across the app is constrained to digits unless overridden.
Route.pattern('id', '[0-9]+')

// ── Explicit model bindings ───────────────────────────────────────────────────
// `{user}` segments resolve to a User object before the route is entered.
// Returning null triggers the route's `missing()` handler.
Route.bind('user', (value) => findUser(value))
// `{article:slug}` resolves scoped to its parent `{user}` (see scopeBindings
// group below). The resolver receives the custom column as `ctx.field` ('slug')
// and the resolved parent author as `ctx.parent`.
Route.bind('article', (value, _to, ctx) => findArticle(value, ctx.parent))

// ── Root redirect ───────────────────────────────────────────────────────────
// Must be top-level: the guest and protected layouts both occupy '/', so the
// bare '/' needs an explicit redirect (otherwise the first layout matches with
// no child and renders blank).
Route.redirect('/', '/dashboard')

// ── Public area (guest-only) wrapped in AuthLayout ──────────────────────────
Route.middleware(log, guest)
  .layout(AuthLayout)
  .group(() => {
    Route.view('login', LoginPage).name('login')
  })

// ── Protected area (auth required) wrapped in MainLayout ────────────────────
Route.middleware(log, auth)
  .layout(MainLayout)
  .group(() => {
    // Basic view routes with names
    Route.view('dashboard', DashboardPage).name('dashboard')
    Route.view('about', AboutPage, { version: '1.0.0' }).name('about')

    // Optional parameter:  /docs  and  /docs/anything
    Route.get('docs/{slug?}', DocPage).name('docs')

    // Per-route regex constraint:  /orders/123  (digits only)
    Route.get('orders/{order}', OrderPage).whereNumber('order').name('orders.show')

    // Resourceful routing → posts.index / posts.create / posts.show / posts.edit
    Route.resource('posts', ResourcePage)

    // Group with prefix + name prefix + model binding + missing handler
    Route.prefix('users')
      .asPrefix('users')
      .group(() => {
        Route.view('', UsersIndex).name('index')
        Route.view('create', UserCreate).name('create')
        Route.get('{user}', UserShow)
          .name('show')
          .missing(() => ({ name: 'users.index' }))
        Route.get('{user}/edit', UserEdit).name('edit')
      })

    // Nested layout + nested routing: MainLayout › SettingsLayout › page.
    // SettingsLayout renders inside MainLayout's <router-view>, and its children
    // render through SettingsLayout's own <router-view>.
    Route.redirect('settings', '/settings/profile')
    Route.layout(SettingsLayout)
      .prefix('settings')
      .asPrefix('settings')
      .group(() => {
        Route.view('profile', SettingsProfile).name('profile')
        Route.view('security', SettingsSecurity).name('security')
        Route.view('notifications', SettingsNotifications).name('notifications')
      })

    // ── Library feature showcase (all introspected by FeaturePage) ───────────

    // Singleton resource (no {id}) → profile.show /profile, profile.edit
    // /profile/edit, profile.create /profile/create (creatable).
    Route.singleton('profile', FeaturePage, { creatable: true })

    // Nested (dot-notation) resource → photos/{photo}/comments/{comment}.
    Route.resource('photos.comments', FeaturePage)

    // Bulk registration → tags.index/show + labels.index/show in one call.
    Route.resources({ tags: FeaturePage, labels: FeaturePage }, { only: ['index', 'show'] })

    // UUID-constrained param.
    Route.get('tokens/{token}', FeaturePage).whereUuid('token').name('tokens.show')

    // Enum (whereIn) constrained param.
    Route.get('plans/{plan}', FeaturePage)
      .whereIn('plan', ['free', 'pro', 'team'])
      .name('plans.show')

    // Default parameter value → Route.route('welcome') yields /en/welcome.
    Route.get('{locale}/welcome', FeaturePage).defaults('locale', 'en').name('welcome')

    // Group-level withoutMiddleware → drops `log` (auth still runs).
    Route.withoutMiddleware(log).group(() => {
      Route.view('status', StatusPage).name('status')
    })

    // Scoped binding + custom key: /authors/{user}/articles/{article:slug}.
    // The article resolver is scoped to the resolved {user} parent.
    Route.scopeBindings().group(() => {
      Route.get('authors/{user}/articles/{article:slug}', FeaturePage)
        .name('articles.show')
        .missing(() => ({ name: 'dashboard' }))
    })

    // Live route table (uses Route.toList())
    Route.view('routes', RouteListPage).name('routes')
  })

// ── Public error page (no layout, no auth) ──────────────────────────────────
Route.view('403', ForbiddenPage).name('error.forbidden')

// ── Permanent (301) redirect ────────────────────────────────────────────────
Route.permanentRedirect('home', '/dashboard')

// ── Fallback (404) ──────────────────────────────────────────────────────────
Route.fallback(NotFoundPage)

export default Route.getRoutes()
