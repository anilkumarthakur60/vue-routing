import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@anil-labs/vue-routing',
  description: 'Laravel-inspired, fully-typed declarative routing for Vue 3.',
  // On GitHub Pages a project site is served from /<repo>/. CI sets DOCS_BASE;
  // locally it defaults to '/'.
  base: process.env['DOCS_BASE'] || '/',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Routing', link: '/guide/routing' },
            { text: 'Groups & Layouts', link: '/guide/groups-and-layouts' },
            { text: 'Middleware', link: '/guide/middleware' },
            { text: 'Model Binding', link: '/guide/model-binding' },
            { text: 'Composables', link: '/guide/composables' },
          ],
        },
      ],
      '/api/': [{ text: 'Reference', items: [{ text: 'API', link: '/api/' }] }],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/anil-labs/vue-routing' }],
    search: { provider: 'local' },
    footer: {
      message: 'Released under the MIT License.',
    },
  },
})
