<script setup lang="ts">
interface AbilityUpgrade {
  tier: number
  desc: string | null
  descZh: string | null
}
interface HeroAbility {
  id: number | null
  name: string
  nameZh: string | null
  image: string | null
  desc: string | null
  descZh: string | null
  cooldown: number | null
  upgrades: AbilityUpgrade[]
}
interface AbilityOrder {
  order: number[]
  matches: number
  winRate: number
  pickRate: number
}
interface AbilityOrderResponse {
  orders: AbilityOrder[]
  totalMatches: number
}
interface StageItem {
  itemId: number
  matches: number
  pickRate: number | null
  winRate: number
  lift: number | null
  sig: 'pos' | 'neg' | 'neutral'
}
interface StageItemsResponse {
  early: StageItem[]
  mid: StageItem[]
  late: StageItem[]
  baseline: number | null
}
interface Hero {
  id: number
  name: string
  nameZh: string | null
  image: string | null
  role: string | null
  roleZh: string | null
  gunTag: string | null
  gunTagZh: string | null
  gun: { damage: number; bullets: number; fireRate: number; clip: number; dps: number } | null
  abilities: HeroAbility[]
}
interface ItemStatLine {
  label: string
  labelZh: string | null
  value: string
}
interface Item {
  id: number
  name: string
  nameZh: string | null
  slot: 'weapon' | 'vitality' | 'spirit'
  cost: number
  tier: number | null
  isActive: boolean
  image: string | null
  desc: string | null
  descZh: string | null
  stats: ItemStatLine[]
}

// ─── i18n: tiny two-locale dictionary. UI chrome is Traditional Chinese;
// item/hero data names come bilingually from the API (en + 简中). ───
const messages = {
  en: {
    tagline: 'Street Brawl item drafting, backed by real win rates from',
    yourHero: 'Your hero',
    pickHero: 'Pick your hero…',
    loadingStats: 'Loading {hero} data…',
    footerText: 'Community project — not affiliated with Valve. Data via the open-source',
    tipActive: 'Active',
    tipPassive: 'Passive',
    tipTier: 'Tier {n}',
    tipSouls: 'souls',
    tipWeapon: 'Weapon',
    tipDamage: 'Damage / shot',
    tipFireRate: 'Fire rate',
    tipClip: 'Clip',
    tipDps: 'DPS ≈',
    perSecond: '/s',
    abilities: 'Abilities on {hero}',
    abilityTier: 'T{n}',
    upgradeOrder: 'Preferred upgrade order',
    upgradeOrderHint:
      'The ability order most Street Brawl players use on this hero (with its usage + win rate). A reference for which ability to level first.',
    pickLabel: 'used by',
    winLabel: 'win',
    noOrderData: 'Not enough upgrade-order data for this hero yet.',
    bestByStage: 'Most-picked items by stage on {hero}',
    stageEarly: 'Early · 0-5 min',
    stageMid: 'Mid · 5-10 min',
    stageLate: 'Late · 10 min+',
    stageHint:
      'Ranked by how often players pick each item at that stage (% = pick rate). The colored number is win-rate lift vs this hero’s average: green = beats it, red = below it, grey = within noise. Win rate alone is misleading (popular/snowball items inflate it), so this shows what players actually build and whether it truly helps.',
    liftTitle: 'Win rate vs this hero’s average (green = above, red = below, grey = not significant)',
  },
  zh: {
    tagline: 'Street Brawl 出裝選擇助手 — 真實勝率資料來自',
    yourHero: '你的英雄',
    pickHero: '選擇你的英雄…',
    loadingStats: '正在載入 {hero} 的數據…',
    footerText: '社群專案 — 與 Valve 無關。資料來自開源的',
    tipActive: '主動',
    tipPassive: '被動',
    tipTier: '階級 {n}',
    tipSouls: '魂魄',
    tipWeapon: '武器',
    tipDamage: '每發傷害',
    tipFireRate: '射速',
    tipClip: '彈匣',
    tipDps: 'DPS ≈',
    perSecond: '/秒',
    abilities: '{hero} 的技能',
    abilityTier: 'T{n}',
    upgradeOrder: '推薦升級順序',
    upgradeOrderHint:
      'Street Brawl 中此英雄最多玩家採用的技能升級順序（含使用率與勝率）。可參考先點哪個技能。',
    pickLabel: '使用率',
    winLabel: '勝率',
    noOrderData: '此英雄的升級順序資料尚不足。',
    bestByStage: '{hero} 各階段熱門選擇',
    stageEarly: '前期 · 0-5 分',
    stageMid: '中期 · 5-10 分',
    stageLate: '後期 · 10 分以上',
    stageHint:
      '依玩家在該階段選用的頻率排序（% = 選用率）。彩色數字是相對此英雄平均勝率的差值：綠＝高於平均、紅＝低於平均、灰＝在誤差範圍內。單看勝率會誤導（熱門／滾雪球物品會虛高），所以這裡顯示玩家實際會選什麼，以及它是否真的有幫助。',
    liftTitle: '相對此英雄平均勝率的差值（綠＝高於、紅＝低於、灰＝不顯著）',
  },
} as const

type LocaleKey = keyof typeof messages.en
// Normalize through a computed so a stale/tampered cookie value (e.g.
// locale=foo) can never index `messages` with an unknown key.
const localeCookie = useCookie<string>('locale', { default: () => 'en' })
const locale = computed<'en' | 'zh'>({
  get: () => (localeCookie.value === 'zh' ? 'zh' : 'en'),
  set: (value) => {
    localeCookie.value = value
  },
})
function t(key: LocaleKey, vars?: Record<string, string | number>): string {
  let text: string = messages[locale.value][key]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}
useHead(() => ({ htmlAttrs: { lang: locale.value === 'zh' ? 'zh-Hant' : 'en' } }))

const { data: heroes } = await useFetch<Hero[]>('/api/heroes')
const { data: items } = await useFetch<Item[]>('/api/items')

const selectedHeroId = ref<number | null>(null)
const abilityOrders = ref<AbilityOrder[]>([])
const stageItems = ref<StageItemsResponse | null>(null)
const heroLoading = ref(false)

const selectedHero = computed(
  () => heroes.value?.find((h) => h.id === selectedHeroId.value) ?? null,
)
// Map ability id → ability, so upgrade-order sequences (lists of ability ids)
// can resolve to names/icons.
const abilityById = computed(() => {
  const map = new Map<number, HeroAbility>()
  for (const ability of selectedHero.value?.abilities ?? []) {
    if (ability.id != null) map.set(ability.id, ability)
  }
  return map
})
// Resolve each order's id sequence into ability objects; drop any order with
// an unresolvable id (stale data) so the UI never renders blank icons.
const resolvedAbilityOrders = computed(() =>
  abilityOrders.value
    .map((o) => {
      const steps = o.order.map((id) => abilityById.value.get(id) ?? null)
      return steps.every((s) => s !== null)
        ? { ...o, steps: steps as HeroAbility[] }
        : null
    })
    .filter((o): o is AbilityOrder & { steps: HeroAbility[] } => o !== null),
)
// Win-rate spread between orders is within noise (~±1%), so we surface only
// the single MOST-POPULAR order — the de-facto standard build — rather than
// chasing the highest win rate.
const topOrder = computed(() => resolvedAbilityOrders.value[0] ?? null)

// Token guards against out-of-order responses when switching heroes quickly:
// only the latest request may write the hero panels.
let heroRequestId = 0
watch(selectedHeroId, async (id) => {
  const requestId = ++heroRequestId
  abilityOrders.value = []
  stageItems.value = null
  // Clearing the hero must also clear loading — a stale in-flight response
  // bails on the token check below and would otherwise leave it stuck true.
  if (id == null) {
    heroLoading.value = false
    return
  }
  heroLoading.value = true
  // Each fetch fails independently — a missing panel must not take down
  // the other. Both routes retry transient upstream hiccups internally.
  const [order, stages] = await Promise.all([
    $fetch<AbilityOrderResponse>('/api/ability-order', { query: { hero_id: id } }).catch(
      () => null,
    ),
    $fetch<StageItemsResponse>('/api/stage-items', { query: { hero_id: id } }).catch(
      () => null,
    ),
  ])
  if (requestId === heroRequestId) {
    abilityOrders.value = order?.orders ?? []
    stageItems.value = stages
    heroLoading.value = false
  }
})

// Most-picked items per game stage. Resolve each stage's item ids against the
// catalog (drop unresolvable ids), carrying pick rate + win-rate lift + sig.
interface StagePick {
  item: Item
  pickRate: number | null
  lift: number | null
  sig: 'pos' | 'neg' | 'neutral'
}
const stageColumns = computed(() => {
  const byId = new Map((items.value ?? []).map((i) => [i.id, i]))
  const resolve = (rows: StageItem[] | undefined): StagePick[] =>
    (rows ?? [])
      .map((r) => {
        const item = byId.get(r.itemId)
        return item ? { item, pickRate: r.pickRate, lift: r.lift, sig: r.sig } : null
      })
      .filter((p): p is StagePick => p !== null)
  return [
    { key: 'early', picks: resolve(stageItems.value?.early) },
    { key: 'mid', picks: resolve(stageItems.value?.mid) },
    { key: 'late', picks: resolve(stageItems.value?.late) },
  ] as const
})
const hasStageData = computed(() => stageColumns.value.some((c) => c.picks.length > 0))

// ─── Hover tooltip: one fixed-position card driven by mouse events. ───
const tip = ref<{ kind: 'item'; item: Item } | { kind: 'hero'; hero: Hero } | null>(null)
const tipPos = ref({ x: 0, y: 0 })
function moveTip(event: MouseEvent) {
  // Hero cards are taller (4 abilities + gun block) — clamp accordingly.
  const estimatedHeight = tip.value?.kind === 'hero' ? 520 : 290
  const x = Math.min(event.clientX + 14, window.innerWidth - 340)
  const y = Math.min(event.clientY + 12, window.innerHeight - estimatedHeight)
  tipPos.value = { x: Math.max(8, x), y: Math.max(8, y) }
}
function showItemTip(item: Item, event: MouseEvent) {
  tip.value = { kind: 'item', item }
  moveTip(event)
}
function showHeroTip(hero: Hero, event: MouseEvent) {
  tip.value = { kind: 'hero', hero }
  moveTip(event)
}
function hideTip() {
  tip.value = null
}
// A hovered element can unmount without firing mouseleave (hero switched,
// stage data reloaded) — clear the tip when its source disappears.
// stageColumns is watched because it updates asynchronously when the stage
// fetch resolves, after selectedHeroId already changed.
watch([selectedHeroId, stageColumns], () => {
  if (!tip.value) return
  if (tip.value.kind === 'hero') {
    if (selectedHero.value?.id !== tip.value.hero.id) tip.value = null
    return
  }
  const itemId = tip.value.item.id
  const stillVisible = stageColumns.value.some((col) =>
    col.picks.some((p) => p.item.id === itemId),
  )
  if (!stillVisible) tip.value = null
})

function zhAware(en: string | null, zh: string | null): string | null {
  return locale.value === 'zh' ? zh ?? en : en
}
// Display name in the active locale only — Chinese in zh mode (fall back to
// English if untranslated), English in en mode. No side-by-side bilingual.
function dispName(en: string, zh: string | null): string {
  return locale.value === 'zh' ? zh ?? en : en
}
const heroName = computed(() =>
  selectedHero.value ? dispName(selectedHero.value.name, selectedHero.value.nameZh) : '',
)
const STAGE_LABEL_KEY = { early: 'stageEarly', mid: 'stageMid', late: 'stageLate' } as const
function stageTitle(key: 'early' | 'mid' | 'late'): string {
  return t(STAGE_LABEL_KEY[key])
}
function formatPct(value: number): string {
  return (value * 100).toFixed(1) + '%'
}
function formatLift(value: number): string {
  return (value >= 0 ? '+' : '') + (value * 100).toFixed(1) + '%'
}
function formatCount(value: number): string {
  return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : String(value)
}
</script>

<template>
  <main class="page">
    <header class="header">
      <div class="header-top">
        <h1>Brawl Advisor</h1>
        <button
          class="lang-btn"
          type="button"
          @click="locale = locale === 'en' ? 'zh' : 'en'"
        >
          {{ locale === 'en' ? '中文' : 'EN' }}
        </button>
      </div>
      <p class="tagline">
        {{ t('tagline') }}
        <a href="https://deadlock-api.com" target="_blank" rel="noopener">deadlock-api.com</a>
      </p>
    </header>

    <section class="panel">
      <h2>{{ t('yourHero') }}</h2>
      <div class="hero-row">
        <img
          v-if="selectedHero?.image"
          :src="selectedHero.image"
          :alt="selectedHero.name"
          class="hero-portrait"
          @mouseenter="showHeroTip(selectedHero!, $event)"
          @mousemove="moveTip"
          @mouseleave="hideTip"
        />
        <select v-model.number="selectedHeroId" class="hero-select">
          <option :value="null" disabled>{{ t('pickHero') }}</option>
          <option v-for="hero in heroes" :key="hero.id" :value="hero.id">
            {{ dispName(hero.name, hero.nameZh) }}
          </option>
        </select>
      </div>
      <p v-if="heroLoading" class="hint">
        {{ t('loadingStats', { hero: heroName }) }}
      </p>
    </section>

    <section v-if="selectedHero && hasStageData" class="panel">
      <h2>{{ t('bestByStage', { hero: heroName }) }}</h2>
      <div class="stage-grid">
        <div v-for="col in stageColumns" :key="col.key" class="stage-col">
          <h3 class="stage-col-title">{{ stageTitle(col.key) }}</h3>
          <ol class="stage-items">
            <li
              v-for="pick in col.picks"
              :key="pick.item.id"
              class="stage-item"
              @mouseenter="showItemTip(pick.item, $event)"
              @mousemove="moveTip"
              @mouseleave="hideTip"
            >
              <img
                v-if="pick.item.image"
                :src="pick.item.image"
                :alt="pick.item.name"
                class="item-icon"
                :class="pick.item.slot"
              />
              <span v-else class="item-icon fallback" :class="pick.item.slot">
                {{ pick.item.name[0] }}
              </span>
              <span class="stage-item-name">
                {{ dispName(pick.item.name, pick.item.nameZh) }}
              </span>
              <span class="stage-item-stats">
                <span v-if="pick.pickRate != null" class="stage-pick">{{ formatPct(pick.pickRate) }}</span>
                <span
                  v-if="pick.lift != null"
                  class="stage-lift"
                  :class="pick.sig"
                  :title="t('liftTitle')"
                >{{ formatLift(pick.lift) }}</span>
              </span>
            </li>
          </ol>
        </div>
      </div>
      <p class="hint">{{ t('stageHint') }}</p>
    </section>

    <section v-if="selectedHero && selectedHero.abilities.length" class="panel">
      <h2>{{ t('abilities', { hero: heroName }) }}</h2>
      <div class="ability-list">
        <div v-for="ability in selectedHero.abilities" :key="ability.name" class="ability-card">
          <div class="ability-head">
            <img
              v-if="ability.image"
              :src="ability.image"
              :alt="ability.name"
              class="ability-icon big"
            />
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

      <h3 class="order-title">{{ t('upgradeOrder') }}</h3>
      <template v-if="topOrder">
        <div class="order-row">
          <div class="order-seq">
            <template v-for="(step, si) in topOrder.steps" :key="si">
              <span v-if="si > 0" class="order-arrow">→</span>
              <img
                v-if="step.image"
                :src="step.image"
                :alt="step.name"
                :title="locale === 'zh' && step.nameZh ? step.nameZh : step.name"
                class="ability-icon"
              />
              <span
                v-else
                class="ability-icon fallback"
                :title="step.name"
              >{{ step.name[0] }}</span>
            </template>
          </div>
          <div class="order-meta">
            <span>{{ t('pickLabel') }} {{ formatPct(topOrder.pickRate) }}</span>
            <span class="wr">{{ t('winLabel') }} {{ formatPct(topOrder.winRate) }}</span>
          </div>
        </div>
        <p class="hint">{{ t('upgradeOrderHint') }}</p>
      </template>
      <p v-else-if="heroLoading" class="hint">{{ t('loadingStats', { hero: heroName }) }}</p>
      <p v-else class="hint">{{ t('noOrderData') }}</p>
    </section>

    <footer class="footer">
      {{ t('footerText') }}
      <a href="https://github.com/deadlock-api" target="_blank" rel="noopener">deadlock-api</a>.
    </footer>

    <!-- ─── Floating hover tooltip ─── -->
    <div
      v-if="tip"
      class="tip"
      :style="{ left: tipPos.x + 'px', top: tipPos.y + 'px' }"
    >
      <template v-if="tip.kind === 'item'">
        <div class="tip-header">
          <img
            v-if="tip.item.image"
            :src="tip.item.image"
            :alt="tip.item.name"
            class="item-icon"
            :class="tip.item.slot"
          />
          <span v-else class="item-icon fallback" :class="tip.item.slot">
            {{ tip.item.name[0] }}
          </span>
          <strong>{{ dispName(tip.item.name, tip.item.nameZh) }}</strong>
        </div>
        <div class="tip-meta">
          <span class="slot" :class="tip.item.slot">{{ tip.item.slot }}</span>
          <span v-if="tip.item.tier">{{ t('tipTier', { n: tip.item.tier }) }}</span>
          <span>{{ tip.item.cost }} {{ t('tipSouls') }}</span>
          <span>{{ tip.item.isActive ? t('tipActive') : t('tipPassive') }}</span>
        </div>
        <p v-if="zhAware(tip.item.desc, tip.item.descZh)" class="tip-desc">
          {{ zhAware(tip.item.desc, tip.item.descZh) }}
        </p>
        <ul v-if="tip.item.stats.length" class="tip-stats">
          <li v-for="stat in tip.item.stats" :key="stat.label">
            <span class="tip-stat-value">{{ stat.value }}</span>
            {{ zhAware(stat.label, stat.labelZh) }}
          </li>
        </ul>
      </template>
      <template v-else>
        <div class="tip-header">
          <img
            v-if="tip.hero.image"
            :src="tip.hero.image"
            :alt="tip.hero.name"
            class="hero-portrait small"
          />
          <strong>{{ dispName(tip.hero.name, tip.hero.nameZh) }}</strong>
        </div>
        <p v-if="zhAware(tip.hero.role, tip.hero.roleZh)" class="tip-role">
          {{ zhAware(tip.hero.role, tip.hero.roleZh) }}
        </p>
        <ul v-if="tip.hero.abilities.length" class="tip-abilities">
          <li v-for="ability in tip.hero.abilities" :key="ability.name" class="tip-ability">
            <img
              v-if="ability.image"
              :src="ability.image"
              :alt="ability.name"
              class="ability-icon"
            />
            <span v-else class="ability-icon fallback">{{ ability.name[0] }}</span>
            <div class="tip-ability-body">
              <div class="tip-ability-name">
                {{ dispName(ability.name, ability.nameZh) }}
                <span v-if="ability.cooldown" class="tip-cd">{{ ability.cooldown }}s</span>
              </div>
              <p v-if="zhAware(ability.desc, ability.descZh)" class="tip-desc clamp2">
                {{ zhAware(ability.desc, ability.descZh) }}
              </p>
            </div>
          </li>
        </ul>
        <div v-if="tip.hero.gun" class="tip-gun">
          <div class="tip-gun-title">
            {{ t('tipWeapon') }}
            <span v-if="zhAware(tip.hero.gunTag, tip.hero.gunTagZh)" class="zh-sub">
              {{ zhAware(tip.hero.gunTag, tip.hero.gunTagZh) }}
            </span>
          </div>
          <ul class="tip-stats">
            <li>
              <span class="tip-stat-value">
                {{ tip.hero.gun.bullets > 1
                  ? `${tip.hero.gun.damage} × ${tip.hero.gun.bullets}`
                  : tip.hero.gun.damage }}
              </span>
              {{ t('tipDamage') }}
            </li>
            <li>
              <span class="tip-stat-value">{{ tip.hero.gun.fireRate }}{{ t('perSecond') }}</span>
              {{ t('tipFireRate') }}
            </li>
            <li>
              <span class="tip-stat-value">{{ tip.hero.gun.clip }}</span>
              {{ t('tipClip') }}
            </li>
            <li>
              <span class="tip-stat-value">{{ tip.hero.gun.dps }}</span>
              {{ t('tipDps') }}
            </li>
          </ul>
        </div>
      </template>
    </div>
  </main>
</template>

<style>
:root {
  color-scheme: dark;
}
body {
  margin: 0;
  background: #14110f;
  color: #e8e2d9;
  font-family: 'Avenir Next', Avenir, 'Segoe UI', Helvetica, Arial, sans-serif;
}
.page {
  max-width: 880px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header h1 {
  margin: 0;
  font-size: 2.2rem;
  letter-spacing: 0.04em;
  color: #f2c879;
}
.lang-btn {
  background: #1d1916;
  color: #cfc4b2;
  border: 1px solid #3a322a;
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  font-size: 0.9rem;
  cursor: pointer;
}
.lang-btn:hover {
  border-color: #f2c879;
  color: #f2c879;
}
.tagline {
  margin-top: 0.35rem;
  color: #a89f91;
}
.tagline a,
.footer a {
  color: #f2c879;
}
.panel {
  background: #1d1916;
  border: 1px solid #2e2822;
  border-radius: 10px;
  padding: 1.1rem 1.25rem;
  margin-top: 1.25rem;
}
.panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
  color: #cfc4b2;
}
.hero-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.hero-portrait {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #3a322a;
  background: #14110f;
}
.hero-portrait.small {
  width: 34px;
  height: 34px;
}
.hero-select,
.draft-input {
  background: #14110f;
  color: #e8e2d9;
  border: 1px solid #3a322a;
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  font-size: 0.95rem;
}
.hero-select {
  min-width: 240px;
}
.draft-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.draft-slot {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.draft-input {
  width: 100%;
  box-sizing: border-box;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: #cfc4b2;
}
.item-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.item-icon {
  width: 26px;
  height: 26px;
  padding: 3px;
  border-radius: 6px;
  object-fit: contain;
  flex-shrink: 0;
}
.item-icon.weapon {
  background: #3d2a1d;
}
.item-icon.vitality {
  background: #1e3320;
}
.item-icon.spirit {
  background: #2b2138;
}
.item-icon.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #e8e2d9;
}
.zh-sub {
  color: #847b6e;
  font-size: 0.86em;
  margin-left: 0.3rem;
}
.hint {
  color: #847b6e;
  font-size: 0.85rem;
  margin-bottom: 0;
}
.verdict {
  font-size: 1.15rem;
  margin: 0 0 0.9rem;
}
.verdict strong {
  color: #f2c879;
}
.verdict-wr {
  margin-left: 0.5rem;
  color: #8fc78f;
}
.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}
.stats-table th {
  text-align: left;
  color: #847b6e;
  font-weight: 600;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid #2e2822;
}
.stats-table td {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid #241f1a;
}
.stats-table tr.best td {
  background: rgba(242, 200, 121, 0.07);
}
.wr {
  color: #8fc78f;
  font-variant-numeric: tabular-nums;
}
.slot {
  text-transform: capitalize;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
}
.slot.weapon {
  background: #3d2a1d;
  color: #e8a36a;
}
.slot.vitality {
  background: #1e3320;
  color: #8fc78f;
}
.slot.spirit {
  background: #2b2138;
  color: #c4a0e8;
}
.badge {
  font-size: 0.78rem;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
}
.badge.hero {
  background: #143226;
  color: #7fd6a8;
}
.badge.global {
  background: #2c2c34;
  color: #9aa0b5;
}
.footer {
  margin-top: 2rem;
  color: #6b6358;
  font-size: 0.82rem;
}

/* ─── Tooltip ─── */
.tip {
  position: fixed;
  z-index: 50;
  width: 320px;
  background: #211c18;
  border: 1px solid #45392c;
  border-radius: 10px;
  padding: 0.8rem 0.95rem;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  font-size: 0.88rem;
}
.tip-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.45rem;
}
.tip-header strong {
  color: #f2c879;
  font-size: 0.98rem;
}
.tip-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  color: #a89f91;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}
.tip-desc {
  margin: 0 0 0.5rem;
  color: #cfc4b2;
  line-height: 1.45;
}
.tip-desc.clamp2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.8rem;
  margin: 0.1rem 0 0;
}
.tip-abilities {
  list-style: none;
  margin: 0 0 0.55rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.tip-ability {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.ability-icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: contain;
  background: #2b2138;
  padding: 2px;
  margin-top: 0.1rem;
}
.ability-icon.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #e8e2d9;
}
.ability-icon.big {
  width: 44px;
  height: 44px;
  margin-top: 0;
}

/* ─── Abilities panel ─── */
.ability-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  gap: 0.9rem;
}
.ability-card {
  background: #14110f;
  border: 1px solid #2e2822;
  border-radius: 8px;
  padding: 0.8rem 0.9rem;
}
.ability-head {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
.ability-head-text {
  flex: 1;
  min-width: 0;
}
.ability-title {
  color: #e8e2d9;
  font-weight: 600;
  font-size: 0.95rem;
}
.ability-base {
  margin: 0.25rem 0 0;
  color: #a89f91;
  font-size: 0.84rem;
  line-height: 1.45;
}
.ability-tiers {
  list-style: none;
  margin: 0.65rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.ability-tiers li {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: #cfc4b2;
  font-size: 0.82rem;
  line-height: 1.4;
}
.tier-badge {
  flex-shrink: 0;
  background: #2b2138;
  color: #c4a0e8;
  border-radius: 4px;
  padding: 0.05rem 0.4rem;
  font-size: 0.74rem;
  font-weight: 700;
}
.order-title {
  margin: 1.4rem 0 0.7rem;
  font-size: 0.98rem;
  color: #f2c879;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.order-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem;
  background: #14110f;
  border: 1px solid #241f1a;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}
.order-seq {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.order-arrow {
  color: #6b6358;
  font-size: 0.9rem;
}
.order-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #a89f91;
  font-variant-numeric: tabular-nums;
}

/* ─── Best-by-stage grid ─── */
.stage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
}
.stage-col {
  background: #14110f;
  border: 1px solid #2e2822;
  border-radius: 8px;
  padding: 0.7rem 0.8rem;
}
.stage-col-title {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  color: #f2c879;
  font-weight: 600;
}
.stage-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  counter-reset: rank;
}
.stage-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.stage-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stage-item-stats {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  font-variant-numeric: tabular-nums;
  font-size: 0.82rem;
}
.stage-pick {
  color: #cfc4b2;
}
.stage-lift {
  min-width: 3.1em;
  text-align: right;
}
.stage-lift.pos {
  color: #8fc78f;
}
.stage-lift.neg {
  color: #e08a7a;
}
.stage-lift.neutral {
  color: #6b6358;
}
.tip-ability-body {
  flex: 1;
  min-width: 0;
}
.tip-ability-name {
  color: #e8e2d9;
  font-weight: 600;
  font-size: 0.86rem;
}
.tip-cd {
  float: right;
  color: #847b6e;
  font-weight: 400;
  font-size: 0.78rem;
}
.tip-role {
  margin: 0 0 0.4rem;
  color: #f2c879;
  font-size: 0.85rem;
}
.tip-stats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #a89f91;
}
.tip-stat-value {
  display: inline-block;
  min-width: 64px;
  color: #8fc78f;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.tip-gun {
  border-top: 1px solid #2e2822;
  padding-top: 0.5rem;
  margin-top: 0.2rem;
}
.tip-gun-title {
  color: #e8a36a;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
}
</style>
