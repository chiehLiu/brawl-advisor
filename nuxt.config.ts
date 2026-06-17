// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Static SPA: no server runtime. The browser calls api.deadlock-api.com
  // directly (CORS is open), so this deploys cleanly to GitHub Pages.
  ssr: false,
  // Adds .nojekyll (so /_nuxt assets aren't ignored) + a 404.html SPA fallback.
  nitro: { preset: 'github_pages' },
  // tesseract.js is CommonJS — pre-bundle it so the OCR worker loads cleanly.
  vite: { optimizeDeps: { include: ['tesseract.js'] } },
  // Global base styles (extracted from the old single-page app.vue) so every
  // route shares the same chrome/panel/popover classes.
  css: ['~/assets/css/main.css'],
  // baseURL is set at build time via NUXT_APP_BASE_URL (=/brawl-advisor/ in CI)
  // so local dev stays at root.
  app: {
    head: {
      title: 'Brawl Advisor — Deadlock hero guides',
      meta: [
        {
          name: 'description',
          content:
            'Learn any Deadlock hero: abilities, recommended builds, leveling order, and how to actually play them — for 6v6 and Street Brawl. Data from deadlock-api.com.',
        },
      ],
    },
  },
  devtools: { enabled: true },
})
