<script setup lang="ts">
import {
  fetchHeroes,
  fetchItems,
  fetchAbilityOrder,
  fetchStageItems,
  fetchHeroBuilds,
  type Hero,
  type HeroAbility,
  type Item,
  type AbilityOrder,
  type StageItemsResponse,
  type HeroBuild,
} from '~/lib/deadlock'
import { TEACHING, PATCH_LABEL } from '~/lib/teaching'
import type { LocaleKey } from '~/composables/useUi'

const route = useRoute()
const { locale, t, dispName, zhAware, formatPct, formatLift, formatCount, formatSouls } = useUi()

const heroId = computed(() => Number(route.params.id))

// Shared catalogs (deduped by key across the app).
const { data: heroes } = await useAsyncData('heroes', () => fetchHeroes(), {
  default: () => [] as Hero[],
})
const { data: items } = await useAsyncData('items', () => fetchItems(), {
  default: () => [] as Item[],
})

const hero = computed(() => heroes.value?.find((h) => h.id === heroId.value) ?? null)
const byId = computed(() => new Map((items.value ?? []).map((i) => [i.id, i])))
const heroName = computed(() => (hero.value ? dispName(hero.value.name, hero.value.nameZh) : ''))
useHead(() => ({ title: hero.value ? `${hero.value.name} — Brawl Advisor` : 'Brawl Advisor' }))

const tab = ref<'guide' | 'brawl'>('guide')

// ─── Per-hero analytics (token-guarded against fast hero switches) ───
const guideOrders = ref<AbilityOrder[]>([])
const brawlOrders = ref<AbilityOrder[]>([])
const stageItems = ref<StageItemsResponse | null>(null)
const builds = ref<HeroBuild[]>([])
const loading = ref(false)

let reqId = 0
async function loadHero(id: number) {
  const mine = ++reqId
  guideOrders.value = []
  brawlOrders.value = []
  stageItems.value = null
  builds.value = []
  if (!Number.isInteger(id)) {
    loading.value = false
    return
  }
  loading.value = true
  const [gOrder, bOrder, stages, bld] = await Promise.all([
    fetchAbilityOrder(id, 'normal').catch(() => null),
    fetchAbilityOrder(id, 'street_brawl').catch(() => null),
    fetchStageItems(id).catch(() => null),
    fetchHeroBuilds(id).catch(() => [] as HeroBuild[]),
  ])
  if (mine !== reqId) return
  guideOrders.value = gOrder?.orders ?? []
  brawlOrders.value = bOrder?.orders ?? []
  stageItems.value = stages
  builds.value = bld ?? []
  loading.value = false
}
watch(heroId, (id) => loadHero(id), { immediate: true })

// ─── §1 Abilities & leveling ───
const abilityById = computed(() => {
  const m = new Map<number, HeroAbility>()
  for (const a of hero.value?.abilities ?? []) if (a.id != null) m.set(a.id, a)
  return m
})
function resolveOrders(orders: AbilityOrder[]) {
  return orders
    .map((o) => {
      const steps = o.order.map((id) => abilityById.value.get(id) ?? null)
      return steps.every((s) => s !== null) ? { ...o, steps: steps as HeroAbility[] } : null
    })
    .filter((o): o is AbilityOrder & { steps: HeroAbility[] } => o !== null)
}
const guideTopOrder = computed(() => resolveOrders(guideOrders.value)[0] ?? null)
const brawlTopOrder = computed(() => resolveOrders(brawlOrders.value)[0] ?? null)

// ─── §2 Recommended builds (resolve items, group by slot, infer archetype) ───
const SLOT_ORDER = ['weapon', 'vitality', 'spirit'] as const
const CORE_PER_SLOT = 6 // community builds list 20+ items; show the core few per slot
type Archetype = 'weapon' | 'spirit' | 'tank' | 'hybrid'
interface ResolvedBuild {
  build: HeroBuild
  groups: { slot: 'weapon' | 'vitality' | 'spirit'; items: Item[]; extra: number }[]
  archetype: Archetype
}
const resolvedBuilds = computed<ResolvedBuild[]>(() =>
  builds.value
    .map((b): ResolvedBuild => {
      const resolved = b.itemIds.map((id) => byId.value.get(id)).filter((i): i is Item => !!i)
      const groups = SLOT_ORDER.map((slot) => {
        const all = resolved.filter((i) => i.slot === slot)
        return { slot, items: all.slice(0, CORE_PER_SLOT), extra: Math.max(0, all.length - CORE_PER_SLOT) }
      }).filter((g) => g.items.length)
      const w = resolved.filter((i) => i.slot === 'weapon').length
      const s = resolved.filter((i) => i.slot === 'spirit').length
      const v = resolved.filter((i) => i.slot === 'vitality').length
      let archetype: Archetype = 'hybrid'
      if (v >= w + s) archetype = 'tank'
      else if (w > s * 1.3) archetype = 'weapon'
      else if (s > w * 1.3) archetype = 'spirit'
      return { build: b, groups, archetype }
    })
    .filter((rb) => rb.groups.length),
)
const ARCH_KEY: Record<Archetype, LocaleKey> = {
  weapon: 'archWeapon',
  spirit: 'archSpirit',
  tank: 'archTank',
  hybrid: 'archHybrid',
}

// ─── §3 Teaching (verified, authored) ───
const teaching = computed(() => {
  const tb = TEACHING[heroId.value]
  return tb ? tb[locale.value] : null
})

// ─── Brawl tab: typical loadout (reused) ───
const SLOT_CAP = 4
interface LoadoutPick {
  item: Item
  lift: number | null
  sig: 'pos' | 'neg' | 'neutral'
}
const loadoutView = computed(() => {
  const overall = stageItems.value?.overall
  if (!overall || !overall.length) return null
  const seen = new Set<number>()
  const groups = SLOT_ORDER.map((slot) => {
    const picks: LoadoutPick[] = []
    for (const r of overall) {
      if (picks.length >= SLOT_CAP) break
      if (seen.has(r.itemId)) continue
      const item = byId.value.get(r.itemId)
      if (item && item.slot === slot) {
        seen.add(r.itemId)
        picks.push({ item, lift: r.lift, sig: r.sig })
      }
    }
    return { slot, picks }
  }).filter((g) => g.picks.length > 0)
  if (!groups.length) return null
  const totalCost = groups.reduce((s, g) => s + g.picks.reduce((c, p) => c + p.item.cost, 0), 0)
  const count = groups.reduce((s, g) => s + g.picks.length, 0)
  return { groups, count, totalCost }
})

// ─── Detail popover (click-toggled), ported from the old single page ───
const tip = ref<{ kind: 'item'; item: Item } | { kind: 'hero'; hero: Hero } | null>(null)
const tipPos = ref({ x: 0, y: 0 })
const narrow = ref(false)
function positionTip(el: HTMLElement, tall: boolean) {
  if (narrow.value) return
  const rect = el.getBoundingClientRect()
  const w = 320
  const h = tall ? 520 : 290
  let x = rect.right + 10
  if (x + w > window.innerWidth - 8) x = rect.left - w - 10
  x = Math.min(Math.max(8, x), window.innerWidth - w - 8)
  const y = Math.min(Math.max(8, rect.top), window.innerHeight - h - 8)
  tipPos.value = { x, y }
}
function toggleItemTip(item: Item, event: MouseEvent) {
  if (tip.value?.kind === 'item' && tip.value.item.id === item.id) {
    tip.value = null
    return
  }
  tip.value = { kind: 'item', item }
  positionTip(event.currentTarget as HTMLElement, false)
}
function toggleHeroTip(h: Hero, event: MouseEvent) {
  if (tip.value?.kind === 'hero' && tip.value.hero.id === h.id) {
    tip.value = null
    return
  }
  tip.value = { kind: 'hero', hero: h }
  positionTip(event.currentTarget as HTMLElement, true)
}
function closeTip() {
  tip.value = null
}
function onTipKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeTip()
}
function onResize() {
  narrow.value = window.innerWidth < 560
  closeTip()
}
onMounted(() => {
  narrow.value = window.innerWidth < 560
  window.addEventListener('scroll', closeTip, { capture: true, passive: true })
  window.addEventListener('resize', onResize)
  document.addEventListener('click', closeTip)
  document.addEventListener('keydown', onTipKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', closeTip, { capture: true })
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', closeTip)
  document.removeEventListener('keydown', onTipKey)
})
// Clear the tip when its source disappears (hero switch / tab change).
watch([heroId, tab], () => {
  closeTip()
})

// ─── Display helpers ───
const SLOT_KEY: Record<'weapon' | 'vitality' | 'spirit', LocaleKey> = {
  weapon: 'slotWeapon',
  vitality: 'slotVitality',
  spirit: 'slotSpirit',
}
function roleText(): string | null {
  return hero.value ? zhAware(hero.value.role, hero.value.roleZh) : null
}
function playstyleText(): string | null {
  return hero.value ? zhAware(hero.value.playstyle, hero.value.playstyleZh) : null
}
function stars(n: number | null): string {
  const c = n ?? 0
  return '●'.repeat(c) + '○'.repeat(Math.max(0, 3 - c))
}
</script>

<template>
  <div v-if="hero" class="hero-detail">
    <NuxtLink to="/" class="back-link">← {{ t('back') }}</NuxtLink>

    <!-- ─── Header ─── -->
    <section class="panel hero-head-panel">
      <div class="hero-head">
        <img
          v-if="hero.image"
          :src="hero.image"
          :alt="hero.name"
          class="hero-portrait clickable"
          :title="t('tapInfo')"
          @click.stop="toggleHeroTip(hero, $event)"
        />
        <div class="hero-head-text">
          <div class="hero-head-title">
            <h2>{{ heroName }}</h2>
            <span class="hero-cx" :title="`${t('difficulty')} ${hero.complexity ?? '?'}`">{{ stars(hero.complexity) }}</span>
          </div>
          <p v-if="roleText()" class="hero-role-line">{{ roleText() }}</p>
          <div v-if="hero.tags.length" class="hero-tags">
            <span v-for="tg in hero.tags" :key="tg" class="hero-tag">{{ tg }}</span>
          </div>
        </div>
      </div>
      <p v-if="playstyleText()" class="hero-playstyle">{{ playstyleText() }}</p>
      <p class="patch-stamp">{{ t('verifiedAs', { date: PATCH_LABEL }) }}</p>
    </section>

    <!-- ─── Abilities (shared: the kit + tier values are identical in both modes) ─── -->
    <section v-if="hero.abilities.length" class="panel">
      <h2>{{ t('abilities') }}</h2>
      <div class="ability-list">
        <div v-for="ability in hero.abilities" :key="ability.name" class="ability-card">
          <div class="ability-head">
            <img v-if="ability.image" :src="ability.image" :alt="ability.name" class="ability-icon big" />
            <span v-else class="ability-icon big fallback">{{ ability.name[0] }}</span>
            <div class="ability-head-text">
              <div class="ability-title">
                {{ dispName(ability.name, ability.nameZh) }}
                <span v-if="ability.cooldown" class="tip-cd">{{ ability.cooldown }}s</span>
              </div>
              <p v-if="zhAware(ability.desc, ability.descZh)" class="ability-base">
                {{ zhAware(ability.desc, ability.descZh) }}
              </p>
            </div>
          </div>
          <ul v-if="ability.upgrades.length" class="ability-tiers">
            <li v-for="up in ability.upgrades" :key="up.tier">
              <span class="tier-badge">{{ t('abilityTier', { n: up.tier }) }}</span>
              <span>{{ zhAware(up.desc, up.descZh) }}</span>
            </li>
          </ul>
        </div>
      </div>
      <p class="hint">{{ t('abilitiesModeNote') }}</p>
    </section>

    <!-- ─── Tabs ─── -->
    <nav class="mode-toggle">
      <button type="button" :class="{ active: tab === 'guide' }" @click="tab = 'guide'">
        {{ t('tabGuide') }}
      </button>
      <button type="button" :class="{ active: tab === 'brawl' }" @click="tab = 'brawl'">
        {{ t('tabBrawl') }}
      </button>
    </nav>

    <!-- ═══════════════ GUIDE (6v6) ═══════════════ -->
    <template v-if="tab === 'guide'">
      <!-- §1 Leveling order (6v6 — mode-specific) -->
      <section class="panel">
        <h2>{{ t('upgradeOrder') }}</h2>
        <template v-if="guideTopOrder">
          <div class="order-row">
            <div class="order-seq">
              <template v-for="(step, si) in guideTopOrder.steps" :key="si">
                <span v-if="si > 0" class="order-arrow">→</span>
                <img
                  v-if="step.image"
                  :src="step.image"
                  :alt="step.name"
                  :title="locale === 'zh' && step.nameZh ? step.nameZh : step.name"
                  class="ability-icon"
                />
                <span v-else class="ability-icon fallback" :title="step.name">{{ step.name[0] }}</span>
              </template>
            </div>
            <div class="order-meta">
              <span>{{ t('pickLabel') }} {{ formatPct(guideTopOrder.pickRate) }}</span>
              <span class="wr">{{ t('winLabel') }} {{ formatPct(guideTopOrder.winRate) }}</span>
            </div>
          </div>
          <p class="hint">{{ t('upgradeOrderHint') }}</p>
        </template>
        <p v-else-if="loading" class="hint">{{ t('loadingStats', { hero: heroName }) }}</p>
        <p v-else class="hint">{{ t('noOrderData') }}</p>
      </section>

      <!-- §2 Recommended builds -->
      <section class="panel">
        <h2>{{ t('builds') }}</h2>
        <div v-if="resolvedBuilds.length" class="builds">
          <div v-for="rb in resolvedBuilds" :key="rb.build.buildId" class="build-card">
            <div class="build-card-head">
              <span class="arch-tag" :class="rb.archetype">{{ t(ARCH_KEY[rb.archetype]) }}</span>
              <span class="build-name" :title="rb.build.name">{{ rb.build.name }}</span>
              <span class="build-stats">
                <span class="wr">{{ formatPct(rb.build.winRate) }} {{ t('winLabel') }}</span>
                <span class="build-matches">{{ formatCount(rb.build.matches) }}</span>
              </span>
            </div>
            <div class="build-slots">
              <div v-for="g in rb.groups" :key="g.slot" class="build-slot-row">
                <span class="slot" :class="g.slot">{{ t(SLOT_KEY[g.slot]) }}</span>
                <div class="build-items">
                  <button
                    v-for="it in g.items"
                    :key="it.id"
                    type="button"
                    class="build-item clickable"
                    :title="dispName(it.name, it.nameZh)"
                    @click.stop="toggleItemTip(it, $event)"
                  >
                    <img v-if="it.image" :src="it.image" :alt="it.name" class="item-icon" :class="it.slot" />
                    <span v-else class="item-icon fallback" :class="it.slot">{{ it.name[0] }}</span>
                  </button>
                  <span v-if="g.extra" class="build-extra">+{{ g.extra }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p v-else-if="loading" class="hint">{{ t('loadingStats', { hero: heroName }) }}</p>
        <p v-else class="hint">{{ t('noBuilds') }}</p>
        <p class="hint">{{ t('buildsHint') }}</p>
      </section>

      <!-- §3 How to play & improve -->
      <section class="panel">
        <h2>{{ t('play') }}</h2>
        <div v-if="teaching" class="teach">
          <p v-if="!teaching.verified" class="teach-draft">⚠ {{ t('teachDraft') }}</p>
          <div class="teach-block">
            <h3 class="teach-h win">{{ t('winCondition') }}</h3>
            <p>{{ teaching.winCondition }}</p>
          </div>
          <div class="teach-block">
            <h3 class="teach-h">{{ t('powerCurve') }}</h3>
            <div class="power-grid">
              <div class="power-cell">
                <span class="power-when">{{ t('pcEarly') }}</span>
                <p>{{ teaching.powerCurve.early }}</p>
              </div>
              <div class="power-cell">
                <span class="power-when">{{ t('pcMid') }}</span>
                <p>{{ teaching.powerCurve.mid }}</p>
              </div>
              <div class="power-cell">
                <span class="power-when">{{ t('pcLate') }}</span>
                <p>{{ teaching.powerCurve.late }}</p>
              </div>
            </div>
          </div>
          <div class="teach-block">
            <h3 class="teach-h">{{ t('coreCombo') }}</h3>
            <p>{{ teaching.coreCombo }}</p>
          </div>
          <div class="teach-block">
            <h3 class="teach-h">{{ t('commonMistakes') }}</h3>
            <ul class="mistakes">
              <li v-for="(m, mi) in teaching.commonMistakes" :key="mi" class="mistake">
                <span class="mistake-x">✕ {{ m.mistake }}</span>
                <span class="mistake-fix">✓ {{ t('mistakeFix') }}: {{ m.fix }}</span>
              </li>
            </ul>
          </div>
          <p v-if="teaching.sources.length" class="hint teach-sources">
            {{ t('teachSources') }}:
            <a v-for="(s, si) in teaching.sources" :key="si" :href="s" target="_blank" rel="noopener">[{{ si + 1 }}]</a>
          </p>
        </div>
        <p v-else class="hint">{{ t('teachSoon') }}</p>
      </section>
    </template>

    <!-- ═══════════════ STREET BRAWL ═══════════════ -->
    <template v-else>
      <section v-if="teaching" class="panel">
        <h2>{{ t('coreCombo') }}</h2>
        <p v-if="!teaching.verified" class="teach-draft">⚠ {{ t('teachDraft') }}</p>
        <p class="combo-text">{{ teaching.coreCombo }}</p>
      </section>

      <section v-if="loadoutView" class="panel">
        <h2>{{ t('loadout') }}</h2>
        <p class="build-meta">
          <span>{{ t('loadoutTotal', { n: loadoutView.count }) }}</span>
          <span class="build-fav">{{ formatSouls(loadoutView.totalCost) }} {{ t('tipSouls') }}</span>
        </p>
        <div class="stage-grid">
          <div v-for="g in loadoutView.groups" :key="g.slot" class="stage-col">
            <h3 class="stage-col-title">
              <span class="slot" :class="g.slot">{{ t(SLOT_KEY[g.slot]) }}</span>
              <span class="slot-count">{{ g.picks.length }}/{{ SLOT_CAP }}</span>
            </h3>
            <ol class="stage-items">
              <li
                v-for="p in g.picks"
                :key="p.item.id"
                class="stage-item clickable"
                :class="{ active: tip?.kind === 'item' && tip.item.id === p.item.id }"
                :title="t('tapInfo')"
                @click.stop="toggleItemTip(p.item, $event)"
              >
                <img v-if="p.item.image" :src="p.item.image" :alt="p.item.name" class="item-icon" :class="p.item.slot" />
                <span v-else class="item-icon fallback" :class="p.item.slot">{{ p.item.name[0] }}</span>
                <span class="stage-item-name">{{ dispName(p.item.name, p.item.nameZh) }}</span>
                <span class="stage-item-stats">
                  <span class="stage-pick">{{ p.item.cost }}</span>
                  <span v-if="p.lift != null" class="stage-lift" :class="p.sig" :title="t('liftTitle')">{{ formatLift(p.lift) }}</span>
                </span>
              </li>
            </ol>
          </div>
        </div>
        <p class="hint">{{ t('loadoutHint') }}</p>
      </section>

      <section v-if="brawlTopOrder" class="panel">
        <h2>{{ t('upgradeOrder') }}</h2>
        <div class="order-row">
          <div class="order-seq">
            <template v-for="(step, si) in brawlTopOrder.steps" :key="si">
              <span v-if="si > 0" class="order-arrow">→</span>
              <img
                v-if="step.image"
                :src="step.image"
                :alt="step.name"
                :title="locale === 'zh' && step.nameZh ? step.nameZh : step.name"
                class="ability-icon"
              />
              <span v-else class="ability-icon fallback" :title="step.name">{{ step.name[0] }}</span>
            </template>
          </div>
          <div class="order-meta">
            <span>{{ t('pickLabel') }} {{ formatPct(brawlTopOrder.pickRate) }}</span>
            <span class="wr">{{ t('winLabel') }} {{ formatPct(brawlTopOrder.winRate) }}</span>
          </div>
        </div>
      </section>
    </template>

    <!-- ─── Click-toggled detail popover ─── -->
    <div
      v-if="tip"
      class="tip"
      :class="{ 'tip--sheet': narrow }"
      :style="narrow ? undefined : { left: tipPos.x + 'px', top: tipPos.y + 'px' }"
      @click.stop
    >
      <button class="tip-close" type="button" :aria-label="t('close')" @click="closeTip">×</button>
      <template v-if="tip.kind === 'item'">
        <div class="tip-header">
          <img v-if="tip.item.image" :src="tip.item.image" :alt="tip.item.name" class="item-icon" :class="tip.item.slot" />
          <span v-else class="item-icon fallback" :class="tip.item.slot">{{ tip.item.name[0] }}</span>
          <strong>{{ dispName(tip.item.name, tip.item.nameZh) }}</strong>
        </div>
        <div class="tip-meta">
          <span class="slot" :class="tip.item.slot">{{ tip.item.slot }}</span>
          <span v-if="tip.item.tier">{{ t('tipTier', { n: tip.item.tier }) }}</span>
          <span>{{ tip.item.cost }} {{ t('tipSouls') }}</span>
          <span>{{ tip.item.isActive ? t('tipActive') : t('tipPassive') }}</span>
        </div>
        <p v-if="zhAware(tip.item.desc, tip.item.descZh)" class="tip-desc">{{ zhAware(tip.item.desc, tip.item.descZh) }}</p>
        <ul v-if="tip.item.stats.length" class="tip-stats">
          <li v-for="stat in tip.item.stats" :key="stat.label">
            <span class="tip-stat-value">{{ stat.value }}</span>
            {{ zhAware(stat.label, stat.labelZh) }}
          </li>
        </ul>
      </template>
      <template v-else>
        <div class="tip-header">
          <img v-if="tip.hero.image" :src="tip.hero.image" :alt="tip.hero.name" class="hero-portrait small" />
          <strong>{{ dispName(tip.hero.name, tip.hero.nameZh) }}</strong>
        </div>
        <p v-if="zhAware(tip.hero.role, tip.hero.roleZh)" class="tip-role">{{ zhAware(tip.hero.role, tip.hero.roleZh) }}</p>
        <ul v-if="tip.hero.abilities.length" class="tip-abilities">
          <li v-for="ability in tip.hero.abilities" :key="ability.name" class="tip-ability">
            <img v-if="ability.image" :src="ability.image" :alt="ability.name" class="ability-icon" />
            <span v-else class="ability-icon fallback">{{ ability.name[0] }}</span>
            <div class="tip-ability-body">
              <div class="tip-ability-name">
                {{ dispName(ability.name, ability.nameZh) }}
                <span v-if="ability.cooldown" class="tip-cd">{{ ability.cooldown }}s</span>
              </div>
              <p v-if="zhAware(ability.desc, ability.descZh)" class="tip-desc clamp2">{{ zhAware(ability.desc, ability.descZh) }}</p>
            </div>
          </li>
        </ul>
        <div v-if="tip.hero.gun" class="tip-gun">
          <div class="tip-gun-title">
            {{ t('tipWeapon') }}
            <span v-if="zhAware(tip.hero.gunTag, tip.hero.gunTagZh)" class="zh-sub">{{ zhAware(tip.hero.gunTag, tip.hero.gunTagZh) }}</span>
          </div>
          <ul class="tip-stats">
            <li>
              <span class="tip-stat-value">{{ tip.hero.gun.bullets > 1 ? `${tip.hero.gun.damage} × ${tip.hero.gun.bullets}` : tip.hero.gun.damage }}</span>
              {{ t('tipDamage') }}
            </li>
            <li><span class="tip-stat-value">{{ tip.hero.gun.fireRate }}{{ t('perSecond') }}</span> {{ t('tipFireRate') }}</li>
            <li><span class="tip-stat-value">{{ tip.hero.gun.clip }}</span> {{ t('tipClip') }}</li>
            <li><span class="tip-stat-value">{{ tip.hero.gun.dps }}</span> {{ t('tipDps') }}</li>
          </ul>
        </div>
      </template>
    </div>
  </div>

  <div v-else class="panel not-found">
    <p>{{ loading ? '…' : 'Hero not found.' }}</p>
    <NuxtLink to="/" class="back-link">← {{ t('back') }}</NuxtLink>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin: 1.1rem 0 0;
  color: #a89f91;
  text-decoration: none;
  font-size: 0.9rem;
}
.back-link:hover {
  color: #f2c879;
}
.hero-head-panel {
  margin-top: 0.7rem;
}
.hero-head {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}
.hero-head .hero-portrait {
  width: 64px;
  height: 64px;
}
.hero-head-text {
  flex: 1;
  min-width: 0;
}
.hero-head-title {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}
.hero-head-title h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #f2c879;
}
.hero-cx {
  letter-spacing: 1px;
  color: #f2c879;
  font-size: 0.8rem;
}
.hero-role-line {
  margin: 0.2rem 0 0;
  color: #cfc4b2;
  font-size: 0.9rem;
}
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.4rem;
}
.hero-tag {
  background: #14110f;
  border: 1px solid #2e2822;
  color: #847b6e;
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
  font-size: 0.72rem;
}
.hero-playstyle {
  margin: 0.8rem 0 0;
  color: #a89f91;
  font-size: 0.9rem;
  line-height: 1.5;
}
.patch-stamp {
  margin: 0.6rem 0 0;
  color: #6b6358;
  font-size: 0.75rem;
}
/* §2 builds */
.builds {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.build-card {
  background: #14110f;
  border: 1px solid #2e2822;
  border-radius: 8px;
  padding: 0.7rem 0.85rem;
}
.build-card-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}
.arch-tag {
  flex-shrink: 0;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 5px;
}
.arch-tag.weapon {
  background: #3d2a1d;
  color: #e8a36a;
}
.arch-tag.spirit {
  background: #2b2138;
  color: #c4a0e8;
}
.arch-tag.tank {
  background: #1e3320;
  color: #8fc78f;
}
.arch-tag.hybrid {
  background: #2c2c34;
  color: #9aa0b5;
}
.build-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #cfc4b2;
  font-size: 0.85rem;
}
.build-stats {
  flex-shrink: 0;
  display: flex;
  gap: 0.6rem;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}
.build-matches {
  color: #6b6358;
}
.build-slot-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.4rem;
}
.build-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.build-item {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  line-height: 0;
}
.build-extra {
  align-self: center;
  color: #6b6358;
  font-size: 0.78rem;
}
/* §3 teaching */
.teach {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.teach-draft {
  margin: 0;
  background: #2e2618;
  border: 1px solid #4a3a1e;
  color: #e8c07a;
  border-radius: 8px;
  padding: 0.45rem 0.7rem;
  font-size: 0.8rem;
}
.teach-block p,
.combo-text {
  margin: 0.35rem 0 0;
  color: #cfc4b2;
  line-height: 1.55;
  font-size: 0.92rem;
}
.teach-h {
  margin: 0;
  font-size: 0.95rem;
  color: #f2c879;
}
.teach-h.win {
  color: #8fc78f;
}
.power-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-top: 0.45rem;
}
.power-cell {
  background: #14110f;
  border: 1px solid #241f1a;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
}
.power-when {
  color: #f2c879;
  font-size: 0.78rem;
  font-weight: 700;
}
.power-cell p {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: #cfc4b2;
}
.mistakes {
  list-style: none;
  margin: 0.45rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.mistake {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  background: #14110f;
  border: 1px solid #241f1a;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
}
.mistake-x {
  color: #e08a7a;
  font-size: 0.88rem;
}
.mistake-fix {
  color: #8fc78f;
  font-size: 0.86rem;
}
.teach-sources a {
  color: #f2c879;
  margin-left: 0.25rem;
}
.not-found {
  margin-top: 1.5rem;
}
@media (max-width: 560px) {
  .power-grid {
    grid-template-columns: 1fr;
  }
}
</style>
