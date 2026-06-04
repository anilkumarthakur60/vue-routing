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
      { text: 'npm', link: 'https://www.npmjs.com/package/@anil-labs/vue-routing' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why vue-routing', link: '/guide/why' },
          ],
        },
        {
          text: 'Routing',
          items: [
            { text: 'Defining Routes', link: '/guide/routing' },
            { text: 'Parameters & Constraints', link: '/guide/constraints' },
            { text: 'Named Routes & URLs', link: '/guide/url-generation' },
            { text: 'Resources', link: '/guide/resources' },
          ],
        },
        {
          text: 'Structure',
          items: [
            { text: 'Groups & Layouts', link: '/guide/groups-and-layouts' },
            { text: 'Middleware', link: '/guide/middleware' },
            { text: 'Subdomains', link: '/guide/subdomains' },
          ],
        },
        {
          text: 'Data & Components',
          items: [
            { text: 'Model Binding', link: '/guide/model-binding' },
            { text: 'Composables', link: '/guide/composables' },
          ],
        },
      ],
      '/api/': [{ text: 'Reference', items: [{ text: 'API', link: '/api/' }] }],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/anilkumarthakur60/vue-routing' }],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/anilkumarthakur60/vue-routing/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Anil Kumar Thakur',
    },
  },
})
