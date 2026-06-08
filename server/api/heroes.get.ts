// Cached proxy for the community deadlock-api hero assets.
// Cache for 1h — the roster only changes on big patches.
// Fetches English + Simplified Chinese, the weapon catalog (gun numbers),
// and the ability catalog (the 4 signature abilities per hero).
// The v1 host is used because only it honors the `language` param.
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
interface RawAbilityDescription {
  desc?: string | null
  t1_desc?: string | null
  t2_desc?: string | null
  t3_desc?: string | null
}
interface RawProperty {
  value?: string | number | null
  label?: string | null
  postfix?: string | null
  display_units?: string | null
}
interface RawPropertyUpgrade {
  name?: string | null
  bonus?: string | number | null
}
interface RawUpgradeTier {
  property_upgrades?: RawPropertyUpgrade[] | null
}
interface RawCatalogItem {
  id?: number | null
  class_name?: string | null
  name?: string | null
  image_webp?: string | null
  weapon_info?: RawWeaponInfo | null
  description?: RawAbilityDescription | null
  properties?: Record<string, RawProperty | undefined> | null
  upgrades?: RawUpgradeTier[] | null
}

const UNIT_SUFFIX: Record<string, string> = {
  EDisplayUnit_Meters: 'm',
  EDisplayUnit_Seconds: 's',
  EDisplayUnit_Percent: '%',
}

// When Valve leaves a tier's description blank, build a readable effect line
// from the structured property_upgrades + the ability's localized labels,
// e.g. {name:"BonusFireRate",bonus:30} + label "射速"/postfix "%" → "+30% 射速".
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

const HEROES_URL = 'https://api.deadlock-api.com/v1/assets/heroes'
const ITEMS_BY_TYPE_URL = 'https://api.deadlock-api.com/v1/assets/items/by-type'
const SIGNATURE_SLOTS = ['signature1', 'signature2', 'signature3', 'signature4'] as const
const ABILITY_DESC_MAX = 220

function stripMarkup(text: string | null | undefined): string | null {
  if (!text) return null
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return null
  return clean.length > ABILITY_DESC_MAX ? clean.slice(0, ABILITY_DESC_MAX) + '…' : clean
}

function buildGun(info: RawWeaponInfo | null | undefined) {
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
  return new Map(
    catalog.filter((c) => c.class_name).map((c) => [c.class_name!, c]),
  )
}

export default defineCachedEventHandler(
  async () => {
    const [en, zh, weapons, abilitiesEn, abilitiesZh] = await Promise.all([
      $fetch<RawHero[]>(HEROES_URL, { query: { only_active: 'true' } }),
      $fetch<RawHero[]>(HEROES_URL, {
        query: { only_active: 'true', language: 'schinese' },
      }),
      $fetch<RawCatalogItem[]>(`${ITEMS_BY_TYPE_URL}/weapon`),
      $fetch<RawCatalogItem[]>(`${ITEMS_BY_TYPE_URL}/ability`),
      $fetch<RawCatalogItem[]>(`${ITEMS_BY_TYPE_URL}/ability`, {
        query: { language: 'schinese' },
      }),
    ])
    const zhById = new Map(zh.map((h) => [h.id, h]))
    const weaponByClass = byClassName(weapons)
    const abilityEnByClass = byClassName(abilitiesEn)
    const abilityZhByClass = byClassName(abilitiesZh)

    return en
      .map((h) => {
        const zhHero = zhById.get(h.id)
        const zhName = zhHero?.name
        const weaponClass = h.items?.weapon_primary
        const weapon = weaponClass ? weaponByClass.get(weaponClass) : undefined

        const abilities = SIGNATURE_SLOTS.map((slot) => {
          const className = h.items?.[slot]
          if (!className) return null
          const enAbility = abilityEnByClass.get(className)
          if (!enAbility?.name) return null
          const zhAbility = abilityZhByClass.get(className)
          const cooldown = Number(enAbility.properties?.AbilityCooldown?.value ?? 0)
          // Three upgrade tiers (T1/T2/T3). Prefer Valve's effect text; when a
          // tier's text is blank, synthesize it from the structured stat
          // upgrades so no tier is silently dropped. Keep the real tier number.
          const tierKeys = ['t1_desc', 't2_desc', 't3_desc'] as const
          const upgrades = tierKeys
            .map((key, i) => {
              const tierData = enAbility.upgrades?.[i]
              return {
                tier: i + 1,
                desc:
                  stripMarkup(enAbility.description?.[key]) ??
                  synthTier(tierData, enAbility.properties),
                descZh:
                  stripMarkup(zhAbility?.description?.[key]) ??
                  synthTier(tierData, zhAbility?.properties),
              }
            })
            .filter((u) => u.desc !== null)
          return {
            id: enAbility.id ?? null,
            name: enAbility.name,
            nameZh:
              zhAbility?.name && zhAbility.name !== enAbility.name ? zhAbility.name : null,
            image: enAbility.image_webp ?? null,
            desc: stripMarkup(enAbility.description?.desc),
            descZh: stripMarkup(zhAbility?.description?.desc),
            cooldown: cooldown > 0 ? cooldown : null,
            upgrades,
          }
        }).filter((a) => a !== null)

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
  },
  { maxAge: 60 * 60, getKey: () => 'heroes-abilities-tiers-v3' },
)
