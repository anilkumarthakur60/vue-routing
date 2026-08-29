<script setup lang="ts">
// Public marketing home for the demo, mounted at '/'. Everything below it in
// the app is the live feature tour; this page pitches the API and leads into
// it. Code snippets are plain strings so the template never tries to parse
// the `{param}` / `() => {}` braces inside them.
const version = __PKG_VERSION__

const heroSnippet = `Route.middleware(auth)
  .layout(MainLayout)
  .group(() => {
    Route.view('dashboard', Dashboard).name('dashboard')
    Route.resource('posts', PostsPage)
    Route.get('orders/{order}', OrderPage).whereNumber('order')
  })`

interface Feature {
  title: string
  desc: string
  code: string
}

const features: Feature[] = [
  {
    title: 'Declarative routes',
    desc: 'Define routes with a fluent, chainable API and name them for type-safe navigation.',
    code: `Route.view('about', AboutPage).name('about')
Route.get('docs/{slug?}', DocPage).name('docs')`,
  },
  {
    title: 'Middleware & groups',
    desc: 'Share middleware, a layout and a prefix across a whole block of routes in one call.',
    code: `Route.middleware(log, auth)
  .layout(MainLayout)
  .group(() => { /* … */ })`,
  },
  {
    title: 'Resource routing',
    desc: 'One line registers index / create / show / edit  nested and bulk forms included.',
    code: `Route.resource('posts', PostsPage)
Route.resources({ tags, labels }, { only: ['index', 'show'] })`,
  },
  {
    title: 'Model binding',
    desc: 'Resolve a param to a real object before the route is entered, with scoped bindings.',
    code: `Route.bind('user', (v) => findUser(v))
// /users/{user} now receives a User`,
  },
  {
    title: 'Param constraints',
    desc: 'Constrain params by number, UUID, enum or your own pattern  globally or per route.',
    code: `Route.get('orders/{order}').whereNumber('order')
Route.get('plans/{plan}').whereIn('plan', ['free', 'pro'])`,
  },
  {
    title: 'Nested layouts',
    desc: 'Compose layouts  a settings shell rendering inside the app shell  with real nesting.',
    code: `Route.layout(SettingsLayout)
  .prefix('settings')
  .group(() => { /* profile, security … */ })`,
  },
]
</script>

<template>
  <div class="landing">
    <header class="lp-header">
      <div class="lp-shell lp-header-inner">
        <div class="lp-brand">
          <span class="lp-mark" aria-hidden="true">↳</span>
          <span class="lp-name">@anil-labs/vue-routing</span>
          <span class="lp-version">v{{ version }}</span>
        </div>
        <nav class="lp-links" aria-label="Project">
          <a href="https://anilkumarthakur60.github.io/vue-routing/">Docs</a>
          <a href="https://github.com/anilkumarthakur60/vue-routing">GitHub</a>
          <a href="https://www.npmjs.com/package/@anil-labs/vue-routing">npm</a>
        </nav>
      </div>
    </header>

    <main>
      <section class="lp-hero">
        <div class="lp-shell lp-hero-inner">
          <div>
            <p class="lp-eyebrow">Laravel-inspired · Vue 3 · TypeScript</p>
            <h1>Routing that reads<br />like Laravel.</h1>
            <p class="lp-lead">
              Define your Vue routes with a fluent, declarative API  middleware, groups, nested
              layouts, resourceful routes, model binding and typed constraints  then hand a plain
              vue-router instance to your app.
            </p>
            <div class="lp-cta">
              <router-link class="lp-btn lp-btn-primary" to="/dashboard" id="cta-demo">
                Open the demo →
              </router-link>
              <router-link class="lp-btn lp-btn-ghost" to="/routes" id="cta-routes">
                Browse the route table
              </router-link>
            </div>
            <ul class="lp-stats">
              <li><strong>1</strong><span>fluent API</span></li>
              <li><strong>0</strong><span>runtime deps beyond vue-router</span></li>
              <li><strong>plain</strong><span>vue-router under the hood</span></li>
            </ul>
          </div>
          <div class="lp-hero-code">
            <div class="lp-code-card">
              <div class="lp-code-head">router/web.ts</div>
              <pre class="lp-pre"><code>{{ heroSnippet }}</code></pre>
            </div>
          </div>
        </div>
      </section>

      <section class="lp-section">
        <div class="lp-shell">
          <div class="lp-section-head">
            <h2>Every routing pattern, declared</h2>
            <p>Each of these is live in the demo  click through after you've read the shape.</p>
          </div>
          <div class="lp-grid">
            <article v-for="f in features" :key="f.title" class="lp-feature">
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
              <pre class="lp-pre lp-pre--sm"><code>{{ f.code }}</code></pre>
            </article>
          </div>
        </div>
      </section>

      <section class="lp-section lp-section--alt">
        <div class="lp-shell lp-explore">
          <div>
            <h2>See it running</h2>
            <p class="lp-lead">
              The demo exercises every feature above against fake data, with working auth
              middleware, nested settings layouts and a live route table introspected from your
              definitions.
            </p>
          </div>
          <div class="lp-explore-links">
            <router-link class="lp-explore-link" to="/dashboard">Dashboard →</router-link>
            <router-link class="lp-explore-link" to="/routes">Live route table →</router-link>
            <router-link class="lp-explore-link" to="/profile">Feature showcase →</router-link>
            <router-link class="lp-explore-link" to="/settings/profile"
              >Nested layouts →</router-link
            >
          </div>
        </div>
      </section>
    </main>

    <footer class="lp-footer">
      <div class="lp-shell">
        Built by <a href="https://github.com/anilkumarthakur60">Anil Kumar Thakur</a> · MIT licensed
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
}
.lp-shell {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
}

.lp-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.lp-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  gap: 16px;
  flex-wrap: wrap;
}
.lp-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 650;
}
.lp-mark {
  color: var(--accent);
  font-size: 18px;
}
.lp-version {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--muted);
}
.lp-links {
  display: flex;
  gap: 16px;
  font-size: 14px;
}
.lp-links a {
  color: var(--muted);
}
.lp-links a:hover {
  color: var(--text);
  text-decoration: none;
}

.lp-hero {
  padding: 72px 0 56px;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(
      820px 340px at 12% -10%,
      color-mix(in srgb, var(--accent) 18%, transparent),
      transparent 70%
    ),
    var(--bg);
}
.lp-hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
  gap: 44px;
  align-items: center;
}
.lp-eyebrow {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
}
.lp-hero h1 {
  margin: 0 0 18px;
  font-size: clamp(34px, 5.5vw, 54px);
  line-height: 1.06;
  letter-spacing: -0.03em;
}
.lp-lead {
  margin: 0 0 24px;
  font-size: 17px;
  color: var(--muted);
  max-width: 54ch;
}
.lp-cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}
.lp-btn {
  display: inline-flex;
  align-items: center;
  border-radius: 9px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
}
.lp-btn:hover {
  text-decoration: none;
}
.lp-btn-primary {
  background: var(--accent);
  color: #0b0f17;
}
.lp-btn-ghost {
  border: 1px solid var(--border);
  color: var(--text);
}
.lp-btn-ghost:hover {
  background: var(--panel-2);
}
.lp-stats {
  display: flex;
  gap: 30px;
  margin: 0;
  padding: 0;
  list-style: none;
  flex-wrap: wrap;
}
.lp-stats li {
  display: flex;
  flex-direction: column;
}
.lp-stats strong {
  font-size: 20px;
}
.lp-stats span {
  font-size: 13px;
  color: var(--muted);
}

.lp-code-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}
.lp-code-head {
  padding: 10px 16px;
  font-size: 12px;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
}
.lp-pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
}
.lp-pre--sm {
  font-size: 12px;
  padding: 12px 14px;
  background: var(--bg);
  border-radius: 10px;
  margin-top: 12px;
}

.lp-section {
  padding: 64px 0;
}
.lp-section--alt {
  background: var(--panel);
  border-block: 1px solid var(--border);
}
.lp-section-head {
  max-width: 60ch;
  margin-bottom: 30px;
}
.lp-section-head h2 {
  margin: 0 0 8px;
  font-size: clamp(24px, 3.5vw, 30px);
  letter-spacing: -0.02em;
}
.lp-section-head p {
  margin: 0;
  color: var(--muted);
}
.lp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
}
.lp-feature {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
}
.lp-feature h3 {
  margin: 0 0 6px;
  font-size: 16px;
}
.lp-feature p {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}

.lp-explore {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
  align-items: center;
}
.lp-explore h2 {
  margin: 0 0 10px;
  font-size: clamp(22px, 3vw, 28px);
  letter-spacing: -0.02em;
}
.lp-explore-links {
  display: grid;
  gap: 10px;
}
.lp-explore-link {
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
  font-weight: 600;
}
.lp-explore-link:hover {
  border-color: var(--accent);
  text-decoration: none;
}

.lp-footer {
  padding: 28px 0;
  border-top: 1px solid var(--border);
  font-size: 14px;
  color: var(--muted);
}

@media (max-width: 860px) {
  .lp-hero-inner,
  .lp-explore {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
