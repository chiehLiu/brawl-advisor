// Client-side data layer. The browser calls the community deadlock-api directly
// (CORS is open: access-control-allow-origin: *), so the app needs no backend
// and deploys as a static SPA. Ported verbatim from the old server/api routes.
import { ofetch } from 'ofetch'

const V1 = 'https://api.deadlock-api.com/v1'
const FETCH_OPTS = { retry: 2, retryDelay: 400, timeout: 20000 } as const

// ─── Public types (shared with the UI) ───
export interface AbilityUpgrade {
  tier: number
  desc: string | null
  descZh: string | null
}
export interface HeroAbility {
  id: number | null
  name: string
  nameZh: string | null
  image: string | null
  desc: string | null
  descZh: string | null
  cooldown: number | null
  upgrades: AbilityUpgrade[]
}
export interface Hero {
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
export interface ItemStatLine {
  label: string
  labelZh: string | null
  value: string
}
export interface Item {
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
export interface AbilityOrder {
  order: number[]
  matches: number
  winRate: number
  pickRate: number
}
export interface AbilityOrderResponse {
  orders: AbilityOrder[]
  totalMatches: number
}
export interface StageItem {
  itemId: number
  matches: number
  pickRate: number | null
  winRate: number
  lift: number | null
  sig: 'pos' | 'neg' | 'neutral'
}
export interface StageItemsResponse {
  early: StageItem[]
  mid: StageItem[]
  late: StageItem[]
  baseline: number | null
}

// ─── Shared helpers ───
const UNIT_SUFFIX: Record<string, string> = {
  EDisplayUnit_Meters: 'm',
  EDisplayUnit_Seconds: 's',
  EDisplayUnit_Percent: '%',
}
const ABILITY_DESC_MAX = 220

function stripMarkup(text: string | null | undefined, cap = false): string | null {
  if (!text) return null
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return null
  return cap && clean.length > ABILITY_DESC_MAX ? clean.slice(0, ABILITY_DESC_MAX) + '…' : clean
}

// ─── Raw upstream shapes ───
interface RawProperty {
  value?: string | number | null
  label?: string | null
  postfix?: string | null
  display_units?: string | null
}
interface RawHero {
  id: number
  name: string
  gun_tag?: string | null
  description?: { role?: string | null } | null
  items?: Record<string, string | undefined> | null
  images?: { icon_image_small_webp?: string | null } | null
}
interface RawWeaponInfo {
  bullet_damage?: number | null
  bullets?: number | null
  cycle_time?: number | null
  clip_size?: number | null
}
interface RawUpgradeTier {
  property_upgrades?: { name?: string | null; bonus?: string | number | null }[] | null
}
interface RawCatalogItem {
  id?: number | null
  class_name?: string | null
  name?: string | null
  image_webp?: string | null
  weapon_info?: RawWeaponInfo | null
  description?: { desc?: string | null; t1_desc?: string | null; t2_desc?: string | null; t3_desc?: string | null } | null
  properties?: Record<string, RawProperty | undefined> | null
  upgrades?: RawUpgradeTier[] | null
}

// ─── Heroes (en + zh + weapon + ability catalogs → joined, tiered, gun) ───
const SIGNATURE_SLOTS = ['signature1', 'signature2', 'signature3', 'signature4'] as const

function synthTier(
  tier: RawUpgradeTier | undefined,
  properties: Record<string, RawProperty | undefined> | null | undefined,
): string | null {
  const parts = (tier?.property_upgrades ?? [])
    .map((up) => {
      const prop = properties?.[up.name ?? '']
      if (!prop?.label) return null
      const n = Number(up.bonus)
      if (!Number.isFinite(n) || n === 0) return null
      const suffix = prop.postfix || (prop.display_units ? UNIT_SUFFIX[prop.display_units] ?? '' : '')
      const sign = n > 0 ? '+' : ''
      return `${sign}${up.bonus}${suffix} ${prop.label}`
    })
    .filter((p): p is string => p !== null)
  return parts.length ? parts.join(', ') : null
}

function buildGun(info: RawWeaponInfo | null | undefined): Hero['gun'] {
  if (!info) return null
  const damage = info.bullet_damage ?? 0
  const bullets = info.bullets ?? 1
  const cycle = info.cycle_time ?? 0
  if (damage <= 0 || cycle <= 0) return null
  const round = (n: number) => Math.round(n * 10) / 10
  return {
    damage: round(damage),
    bullets,
    fireRate: round(1 / cycle),
    clip: info.clip_size ?? 0,
    dps: round((damage * bullets) / cycle),
  }
}

function byClassName(catalog: RawCatalogItem[]): Map<string, RawCatalogItem> {
  return new Map(catalog.filter((c) => c.class_name).map((c) => [c.class_name!, c]))
}

export async function fetchHeroes(): Promise<Hero[]> {
  const heroesUrl = `${V1}/assets/heroes`
  const byType = `${V1}/assets/items/by-type`
  const [en, zh, weapons, abilitiesEn, abilitiesZh] = await Promise.all([
    ofetch<RawHero[]>(heroesUrl, { query: { only_active: 'true' }, ...FETCH_OPTS }),
    ofetch<RawHero[]>(heroesUrl, { query: { only_active: 'true', language: 'schinese' }, ...FETCH_OPTS }),
    ofetch<RawCatalogItem[]>(`${byType}/weapon`, FETCH_OPTS),
    ofetch<RawCatalogItem[]>(`${byType}/ability`, FETCH_OPTS),
    ofetch<RawCatalogItem[]>(`${byType}/ability`, { query: { language: 'schinese' }, ...FETCH_OPTS }),
  ])
  const zhById = new Map(zh.map((h) => [h.id, h]))
  const weaponByClass = byClassName(weapons)
  const abilityEnByClass = byClassName(abilitiesEn)
  const abilityZhByClass = byClassName(abilitiesZh)

  return en
    .map((h): Hero => {
      const zhHero = zhById.get(h.id)
      const zhName = zhHero?.name
      const weaponClass = h.items?.weapon_primary
      const weapon = weaponClass ? weaponByClass.get(weaponClass) : undefined

      const abilities = SIGNATURE_SLOTS.map((slot): HeroAbility | null => {
        const className = h.items?.[slot]
        if (!className) return null
        const enAbility = abilityEnByClass.get(className)
        if (!enAbility?.name) return null
        const zhAbility = abilityZhByClass.get(className)
        const cooldown = Number(enAbility.properties?.AbilityCooldown?.value ?? 0)
        const tierKeys = ['t1_desc', 't2_desc', 't3_desc'] as const
        const upgrades = tierKeys
          .map((key, i) => {
            const tierData = enAbility.upgrades?.[i]
            return {
              tier: i + 1,
              desc: stripMarkup(enAbility.description?.[key]) ?? synthTier(tierData, enAbility.properties),
              descZh: stripMarkup(zhAbility?.description?.[key]) ?? synthTier(tierData, zhAbility?.properties),
            }
          })
          .filter((u) => u.desc !== null)
        return {
          id: enAbility.id ?? null,
          name: enAbility.name,
          nameZh: zhAbility?.name && zhAbility.name !== enAbility.name ? zhAbility.name : null,
          image: enAbility.image_webp ?? null,
          desc: stripMarkup(enAbility.description?.desc, true),
          descZh: stripMarkup(zhAbility?.description?.desc, true),
          cooldown: cooldown > 0 ? cooldown : null,
          upgrades,
        }
      }).filter((a): a is HeroAbility => a !== null)

      return {
        id: h.id,
        name: h.name,
        nameZh: zhName && zhName !== h.name ? zhName : null,
        image: h.images?.icon_image_small_webp ?? null,
        role: h.description?.role ?? null,
        roleZh: zhHero?.description?.role ?? null,
        gunTag: h.gun_tag ?? null,
        gunTagZh: zhHero?.gun_tag ?? null,
        gun: buildGun(weapon?.weapon_info),
        abilities,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Items (en + zh upgrades → tooltip stat lines) ───
interface RawTooltipAttr {
  properties?: string[] | null
  elevated_properties?: string[] | null
}
interface RawItem {
  id: number
  name: string
  item_slot_type: 'weapon' | 'vitality' | 'spirit'
  cost: number | null
  item_tier: number | null
  shopable: boolean | null
  is_active_item: boolean | null
  image_webp: string | null
  description?: { desc?: string | null } | null
  properties?: Record<string, RawProperty | undefined> | null
  tooltip_sections?: Array<{ section_attributes?: RawTooltipAttr[] | null }> | null
}

function tooltipPropertyKeys(item: RawItem): string[] {
  const keys: string[] = []
  for (const section of item.tooltip_sections ?? []) {
    for (const attr of section.section_attributes ?? []) {
      for (const key of [...(attr.properties ?? []), ...(attr.elevated_properties ?? [])]) {
        if (!keys.includes(key)) keys.push(key)
      }
    }
  }
  return keys
}

function formatStatValue(prop: RawProperty): string | null {
  const raw = String(prop.value ?? '').trim()
  if (!raw || raw === '0') return null
  const sign = /^\d/.test(raw) ? '+' : ''
  const suffix = prop.postfix || (prop.display_units ? UNIT_SUFFIX[prop.display_units] ?? '' : '')
  return sign + raw + suffix
}

export async function fetchItems(): Promise<Item[]> {
  const url = `${V1}/assets/items/by-type/upgrade`
  const [en, zh] = await Promise.all([
    ofetch<RawItem[]>(url, FETCH_OPTS),
    ofetch<RawItem[]>(url, { query: { language: 'schinese' }, ...FETCH_OPTS }),
  ])
  const zhById = new Map(zh.map((i) => [i.id, i]))
  return en
    .filter((i) => i.shopable === true)
    .map((i): Item => {
      const zhItem = zhById.get(i.id)
      const zhName = zhItem?.name
      const stats = tooltipPropertyKeys(i)
        .map((key): ItemStatLine | null => {
          const prop = i.properties?.[key]
          if (!prop?.label) return null
          const value = formatStatValue(prop)
          if (!value) return null
          return { label: prop.label, labelZh: zhItem?.properties?.[key]?.label ?? null, value }
        })
        .filter((s): s is ItemStatLine => s !== null)
      return {
        id: i.id,
        name: i.name,
        nameZh: zhName && zhName !== i.name ? zhName : null,
        slot: i.item_slot_type,
        cost: i.cost ?? 0,
        tier: i.item_tier,
        isActive: i.is_active_item === true,
        image: i.image_webp,
        desc: stripMarkup(i.description?.desc),
        descZh: stripMarkup(zhItem?.description?.desc),
        stats,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Ability upgrade order (first-pick order, aggregated) ───
const TOP_ORDERS = 5
const MIN_ORDER_MATCHES = 50

function firstPickOrder(sequence: number[]): number[] {
  const seen: number[] = []
  for (const id of sequence) if (!seen.includes(id)) seen.push(id)
  return seen
}

export async function fetchAbilityOrder(heroId: number): Promise<AbilityOrderResponse> {
  const rows = await ofetch<{ abilities: number[]; wins: number; matches: number }[]>(
    `${V1}/analytics/ability-order-stats`,
    { query: { game_mode: 'street_brawl', hero_id: heroId, min_matches: 20 }, ...FETCH_OPTS },
  )
  const byOrder = new Map<string, { order: number[]; matches: number; wins: number }>()
  let totalMatches = 0
  for (const row of rows) {
    if (!Array.isArray(row.abilities) || row.abilities.length === 0) continue
    const order = firstPickOrder(row.abilities)
    const key = order.join('-')
    const agg = byOrder.get(key) ?? { order, matches: 0, wins: 0 }
    agg.matches += row.matches
    agg.wins += row.wins
    byOrder.set(key, agg)
    totalMatches += row.matches
  }
  const orders = [...byOrder.values()]
    .filter((o) => o.matches >= MIN_ORDER_MATCHES)
    .sort((a, b) => b.matches - a.matches)
    .slice(0, TOP_ORDERS)
    .map((o) => ({
      order: o.order,
      matches: o.matches,
      winRate: o.matches > 0 ? o.wins / o.matches : 0,
      pickRate: totalMatches > 0 ? o.matches / totalMatches : 0,
    }))
  return { orders, totalMatches }
}

// ─── Stage items (pick rate + win-rate lift vs baseline + Wilson sig) ───
const STAGES = [
  { key: 'early', min: null, max: 300 },
  { key: 'mid', min: 300, max: 600 },
  { key: 'late', min: 600, max: null },
] as const
const STAGE_SAMPLE_MIN = 100
const TOP_PER_STAGE = 6

function wilson(wins: number, n: number): [number, number] {
  if (n === 0) return [0, 0]
  const z = 1.96
  const p = wins / n
  const d = 1 + (z * z) / n
  const center = (p + (z * z) / (2 * n)) / d
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d
  return [Math.max(0, center - margin), Math.min(1, center + margin)]
}

function rankStage(
  rows: { item_id: number; wins: number; matches: number }[],
  heroMatches: number | null,
  baseline: number | null,
): StageItem[] {
  return rows
    .filter((r) => r.matches >= STAGE_SAMPLE_MIN)
    .map((r): StageItem => {
      const winRate = r.wins / r.matches
      let sig: StageItem['sig'] = 'neutral'
      if (baseline != null) {
        const [lo, hi] = wilson(r.wins, r.matches)
        sig = lo > baseline ? 'pos' : hi < baseline ? 'neg' : 'neutral'
      }
      return {
        itemId: r.item_id,
        matches: r.matches,
        pickRate: heroMatches ? r.matches / heroMatches : null,
        winRate,
        lift: baseline != null ? winRate - baseline : null,
        sig,
      }
    })
    .sort((a, b) => (b.pickRate ?? b.winRate) - (a.pickRate ?? a.winRate))
    .slice(0, TOP_PER_STAGE)
}

export async function fetchStageItems(heroId: number): Promise<StageItemsResponse> {
  const baseStat = await ofetch<{ hero_id: number; wins: number; matches: number }[]>(
    `${V1}/analytics/hero-stats`,
    { query: { game_mode: 'street_brawl' }, ...FETCH_OPTS },
  )
    .then((rows) => rows.find((h) => h.hero_id === heroId) ?? null)
    .catch(() => null)
  const heroMatches = baseStat?.matches ?? null
  const baseline = baseStat && baseStat.matches > 0 ? baseStat.wins / baseStat.matches : null

  const results = await Promise.all(
    STAGES.map((stage) => {
      const query: Record<string, string> = {
        game_mode: 'street_brawl',
        hero_id: String(heroId),
        min_matches: '20',
      }
      if (stage.min != null) query.min_bought_at_s = String(stage.min)
      if (stage.max != null) query.max_bought_at_s = String(stage.max)
      return ofetch<{ item_id: number; wins: number; matches: number }[]>(
        `${V1}/analytics/item-stats`,
        { query, ...FETCH_OPTS },
      )
        .then((rows) => rankStage(rows, heroMatches, baseline))
        .catch(() => [] as StageItem[])
    }),
  )
  return { early: results[0], mid: results[1], late: results[2], baseline }
}
