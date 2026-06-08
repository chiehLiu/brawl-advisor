// Cached proxy for the community deadlock-api item assets.
// Only shopable upgrades — that is the pool Street Brawl drafts from.
// Fetches English + Simplified Chinese in one cached payload and pre-resolves
// tooltip stat lines (tooltip_sections → properties, like the in-game shop).
// The v1 host is used because only it honors the `language` param.
interface RawProperty {
  label?: string | null
  value?: string | number | null
  postfix?: string | null
  display_units?: string | null
}
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

const ITEMS_URL = 'https://api.deadlock-api.com/v1/assets/items/by-type/upgrade'

const UNIT_SUFFIX: Record<string, string> = {
  EDisplayUnit_Meters: 'm',
  EDisplayUnit_Seconds: 's',
  EDisplayUnit_Percent: '%',
}

function stripMarkup(text: string | null | undefined): string | null {
  if (!text) return null
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return clean || null
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

export default defineCachedEventHandler(
  async () => {
    const [en, zh] = await Promise.all([
      $fetch<RawItem[]>(ITEMS_URL),
      $fetch<RawItem[]>(ITEMS_URL, { query: { language: 'schinese' } }),
    ])
    const zhById = new Map(zh.map((i) => [i.id, i]))
    return en
      .filter((i) => i.shopable === true)
      .map((i) => {
        const zhItem = zhById.get(i.id)
        const zhName = zhItem?.name
        const stats = tooltipPropertyKeys(i)
          .map((key) => {
            const prop = i.properties?.[key]
            if (!prop?.label) return null
            const value = formatStatValue(prop)
            if (!value) return null
            return {
              label: prop.label,
              labelZh: zhItem?.properties?.[key]?.label ?? null,
              value,
            }
          })
          .filter((s) => s !== null)
        return {
          id: i.id,
          name: i.name,
          // Untranslated entries fall back to English upstream — store null
          // so the UI doesn't render the same name twice.
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
  },
  { maxAge: 60 * 60, getKey: () => 'items-tooltips' },
)
