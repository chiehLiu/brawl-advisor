<script setup lang="ts">
// Shell: shared header (home link + language toggle) + footer wrap every route.
// Page content (hero grid, hero detail) renders in <NuxtPage/>. Global styles
// live in ~/assets/css/main.css (loaded via nuxt.config).
const { locale, t } = useUi()
useHead(() => ({ htmlAttrs: { lang: locale.value === 'zh' ? 'zh-Hant' : 'en' } }))
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-top">
        <NuxtLink to="/" class="home-link"><h1>Brawl Advisor</h1></NuxtLink>
        <button class="lang-btn" type="button" @click="locale = locale === 'en' ? 'zh' : 'en'">
          {{ locale === 'en' ? '中文' : 'EN' }}
        </button>
      </div>
      <p class="tagline">
        {{ t('tagline') }}
        <a href="https://deadlock-api.com" target="_blank" rel="noopener">deadlock-api.com</a>
      </p>
    </header>

    <NuxtPage />

    <footer class="footer">
      {{ t('footerText') }}
      <a href="https://github.com/deadlock-api" target="_blank" rel="noopener">deadlock-api</a>.
    </footer>
  </div>
</template>
