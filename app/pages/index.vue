<script setup lang="ts">
import { fetchHeroes, type Hero } from '~/lib/deadlock'
import { STARTER_HERO_IDS } from '~/lib/teaching'
import type { LocaleKey } from '~/composables/useUi'

const { t, dispName } = useUi()
const { data: heroes, pending } = await useAsyncData('heroes', () => fetchHeroes(), {
  default: () => [] as Hero[],
})

const starter = new Set(STARTER_HERO_IDS)
const ROLE_LABEL: Record<string, LocaleKey> = {
  marksman: 'roleMarksman',
  mystic: 'roleMystic',
  brawler: 'roleBrawler',
  assassin: 'roleAssassin',
}
function roleLabel(type: string | null): string {
  const key = type ? ROLE_LABEL[type] : undefined
  return key ? t(key) : (type ?? '')
}

// Roles present in the data, in a stable display order.
const ROLE_ORDER = ['brawler', 'marksman', 'assassin', 'mystic'] as const
const roles = computed(() => {
  const present = new Set((heroes.value ?? []).map((h) => h.heroType).filter(Boolean) as string[])
  return ROLE_ORDER.filter((r) => present.has(r))
})

const roleFilter = ref<string | null>(null)
const search = ref('')

const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (heroes.value ?? [])
    .filter((h) => (roleFilter.value ? h.heroType === roleFilter.value : true))
    .filter((h) => {
      if (!q) return true
      return (
        h.name.toLowerCase().includes(q) || (h.nameZh ? h.nameZh.includes(search.value.trim()) : false)
      )
    })
    .slice()
    .sort((a, b) => {
      // Beginner heroes first, then by complexity, then name.
      const sa = starter.has(a.id) ? 0 : 1
      const sb = starter.has(b.id) ? 0 : 1
      if (sa !== sb) return sa - sb
      const ca = a.complexity ?? 9
      const cb = b.complexity ?? 9
      if (ca !== cb) return ca - cb
      return a.name.localeCompare(b.name)
    })
})

function stars(n: number | null): string {
  const c = n ?? 0
  return '●'.repeat(c) + '○'.repeat(Math.max(0, 3 - c))
}
</script>

<template>
  <section class="grid-wrap">
    <div class="grid-head">
      <h2>{{ t('gridSubtitle') }}</h2>
      <input v-model="search" class="grid-search" type="search" :placeholder="t('searchHero')" />
    </div>

    <div class="filters">
      <button
        class="filter-chip"
        :class="{ on: roleFilter === null }"
        type="button"
        @click="roleFilter = null"
      >
        {{ t('filterAll') }}
      </button>
      <button
        v-for="r in roles"
        :key="r"
        class="filter-chip"
        :class="{ on: roleFilter === r }"
        type="button"
        @click="roleFilter = roleFilter === r ? null : r"
      >
        {{ roleLabel(r) }}
      </button>
    </div>

    <p v-if="pending && !shown.length" class="hint">…</p>

    <div class="hero-grid">
      <NuxtLink v-for="h in shown" :key="h.id" :to="`/hero/${h.id}`" class="hero-card">
        <span v-if="starter.has(h.id)" class="hc-badge">{{ t('startHere') }}</span>
        <img v-if="h.cardImage" :src="h.cardImage" :alt="h.name" class="hc-img" loading="lazy" />
        <span v-else class="hc-img hc-img--fallback">{{ h.name[0] }}</span>
        <span class="hc-name">{{ dispName(h.name, h.nameZh) }}</span>
        <span class="hc-meta">
          <span class="hc-role">{{ roleLabel(h.heroType) }}</span>
          <span class="hc-cx" :title="`${t('difficulty')} ${h.complexity ?? '?'}`">{{ stars(h.complexity) }}</span>
        </span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.grid-wrap {
  margin-top: 1.25rem;
}
.grid-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.7rem;
}
.grid-head h2 {
  margin: 0;
  font-size: 1.05rem;
  color: #cfc4b2;
}
.grid-search {
  background: #14110f;
  color: #e8e2d9;
  border: 1px solid #3a322a;
  border-radius: 8px;
  padding: 0.45rem 0.7rem;
  font-size: 0.9rem;
  min-width: 180px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.1rem;
}
.filter-chip {
  background: #1d1916;
  border: 1px solid #2e2822;
  color: #9c9488;
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
  font-size: 0.85rem;
  cursor: pointer;
}
.filter-chip.on {
  border-color: #f2c879;
  color: #f2c879;
}
.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 0.7rem;
}
.hero-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #e8e2d9;
  background: #1d1916;
  border: 1px solid #2e2822;
  border-radius: 10px;
  padding: 0.5rem 0.5rem 0.6rem;
  transition: border-color 0.12s, transform 0.12s;
}
.hero-card:hover {
  border-color: #f2c879;
  transform: translateY(-2px);
}
.hc-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  background: #14110f;
}
.hc-img--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 700;
  color: #6b6358;
}
.hc-name {
  margin-top: 0.45rem;
  font-size: 0.88rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}
.hc-meta {
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #847b6e;
}
.hc-cx {
  letter-spacing: 1px;
  color: #f2c879;
}
.hc-badge {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  background: #f2c879;
  color: #1a1611;
  font-size: 0.64rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 5px;
  z-index: 1;
}
@media (max-width: 560px) {
  .hero-grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  }
}
</style>
