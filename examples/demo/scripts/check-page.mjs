#!/usr/bin/env node
// Post-build guard for the vue-routing demo's landing page.
//
// vue-tsc validates the components, but it can't tell you whether '/' actually
// resolves to the landing — a mis-registered route, a layout swallowing the
// root, or a redirect left in place would all type-check and build cleanly and
// then show the wrong thing. So this mounts the real built bundle in happy-dom
// (the library's own test DOM), lets the router resolve the initial location,
// and asserts the landing rendered at '/' with its links intact.
//
// Usage:  node scripts/check-page.mjs [outDir]   (default: <repo>/demo-dist)

import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const demoRoot = resolve(here, '..')
const require = createRequire(resolve(demoRoot, 'package.json'))

// The demo builds to <repo>/demo-dist (see the root build:demo script).
const outDir = resolve(demoRoot, process.argv[2] ?? '../../demo-dist')

const failures = []
const check = (condition, msg) => {
  if (!condition) failures.push(msg)
}

const html = readFileSync(resolve(outDir, 'index.html'), 'utf8')
const scriptSrc = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1]
if (!scriptSrc) {
  console.error('✗ check-page: no module script found in index.html')
  process.exit(1)
}

const { Window } = require('happy-dom')
const window = new Window({
  url: 'http://localhost/',
  settings: { disableJavaScriptFileLoading: true, disableJavaScriptEvaluation: true },
})

for (const key of [
  'window',
  'document',
  'navigator',
  'history',
  'location',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'setTimeout',
  'clearTimeout',
  'MutationObserver',
  'HTMLElement',
  'SVGElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'PopStateEvent',
]) {
  if (window[key] === undefined) continue
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true, writable: true })
}

window.document.write(html)

// The built app runs createApp(App).use(router).mount('#app') on import.
await import(pathToFileURL(resolve(outDir, scriptSrc.replace(/^\.?\//, ''))).href)
await window.happyDOM.waitUntilComplete()

const doc = window.document
const $ = (sel) => doc.querySelector(sel)
const $$ = (sel) => [...doc.querySelectorAll(sel)]
const appText = () => $('#app')?.textContent ?? ''

// --------------------------------------------------------------- app mounted

check($('#app')?.childElementCount > 0, '#app is empty — the Vue app did not mount.')

// The landing must render at '/' — not the old dashboard redirect.
check(
  appText().includes('Routing that reads'),
  "landing did not render at '/' (hero text missing).",
)
check(/^v\d/.test($('.lp-version')?.textContent ?? ''), '.lp-version: version was not injected.')

// The feature grid renders every declared feature.
check(
  $$('.lp-feature').length === 6,
  `expected 6 feature cards, found ${$$('.lp-feature').length}.`,
)

// The CTAs are real router-links into the demo (rendered as <a href>).
check(
  $('#cta-demo')?.getAttribute('href') === '/dashboard',
  '#cta-demo: primary CTA does not link to /dashboard.',
)
check(
  $('#cta-routes')?.getAttribute('href') === '/routes',
  '#cta-routes: route-table CTA does not link to /routes.',
)
check($$('.lp-explore-link').length >= 4, 'explore links are missing.')

// ---------------------------------------------------------------------- report

await window.happyDOM.abort()
await window.close()

if (failures.length > 0) {
  console.error(`\n✗ check-page: ${failures.length} problem(s) in ${outDir}\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(`✓ check-page: landing verified in ${outDir}`)
