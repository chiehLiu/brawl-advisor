import type { H3Event } from 'h3'

// Cached proxy for Street Brawl ability upgrade-order analytics.
// The upstream returns one row per distinct full leveling sequence; we collapse
// each into its "first-pick order" (the order the 4 abilities were first taken),
// aggregate matches/wins across sequences that share that order, and return the
// most popular orders with pick rate + win rate. One cache entry per hero.
interface RawOrderRow {
  abilities: number[]
  wins: number
  matches: number
}
interface OrderAgg {
  order: number[]
  matches: number
  wins: number
}

const TOP_ORDERS = 5
const MIN_ORDER_MATCHES = 50

function parseHeroId(event: H3Event): number | null {
  const raw = getQuery(event).hero_id
  const value = Array.isArray(raw) ? raw[0] : raw
  // Strict: Number() rejects "1.5"/"1abc" (parseInt would coerce them to 1).
  const id = Number(String(value ?? '').trim())
  return Number.isInteger(id) && id > 0 ? id : null
}

// Order the 4 distinct abilities by when each first appears in the sequence.
function firstPickOrder(sequence: number[]): number[] {
  const seen: number[] = []
  for (const id of sequence) {
    if (!seen.includes(id)) seen.push(id)
  }
  return seen
}

export default defineCachedEventHandler(
  async (event) => {
    const heroId = parseHeroId(event)
    if (heroId == null) return { orders: [], totalMatches: 0 }

    // These aggregation queries are heavy upstream — retry transient failures
    // so the panel doesn't fall back to "not enough data" on a single hiccup.
    const rows = await $fetch<RawOrderRow[]>(
      'https://api.deadlock-api.com/v1/analytics/ability-order-stats',
      {
        query: { game_mode: 'street_brawl', hero_id: heroId, min_matches: 20 },
        retry: 2,
        retryDelay: 400,
        timeout: 20000,
      },
    )

    const byOrder = new Map<string, OrderAgg>()
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
  },
  {
    maxAge: 60 * 30,
    getKey: (event) => `sb-ability-order-${parseHeroId(event) ?? 'none'}`,
  },
)
