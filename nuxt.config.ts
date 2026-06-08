// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Static SPA: no server runtime. The browser calls api.deadlock-api.com
  // directly (CORS is open), so this deploys cleanly to GitHub Pages.
  ssr: false,
  // Adds .nojekyll (so /_nuxt assets aren't ignored) + a 404.html SPA fallback.
  nitro: { preset: 'github_pages' },
  // baseURL is set at build time via NUXT_APP_BASE_URL (=/brawl-advisor/ in CI)
  // so local dev stays at root.
  app: {
    head: {
      title: 'Brawl Advisor — Deadlock Street Brawl',
      meta: [
        {
          name: 'description',
          content:
            'Deadlock Street Brawl hero reference: most-picked items by stage, abilities, and upgrade order. Data from deadlock-api.com.',
        },
      ],
    },
  },
  devtools: { enabled: true },
})
