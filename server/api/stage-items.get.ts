import type { H3Event } from 'h3'

// Cached proxy that buckets Street Brawl items by acquisition time into three
// stages and ranks them by PICK RATE (what players actually build) rather than
// raw win rate — which is confounded by who-buys-it and survivorship. Each item
// also carries its win-rate LIFT vs the hero's baseline, with a Wilson-interval
// significance flag so "popular but mediocre" is distinguished from "real edge".
// (The API blocks badge filtering for Street Brawl, so no skill bracket here.)
interface RawItemStat {
  item_id: number
  wins: number
  matches: number
}
interface RawHeroStat {
  hero_id: number
  wins: number
  matches: number
}
interface StageItem {
  itemId: number
  matches: number
  pickRate: number | null
  winRate: number
  lift: number | null
  sig: 'pos' | 'neg' | 'neutral'
}

// Acquisition-time windows (seconds). Street Brawl grants items per round, so
// these map roughly to early / mid / late rounds of a match.
const STAGES = [
  { key: 'early', min: null, max: 300 },
  { key: 'mid', min: 300, max: 600 },
  { key: 'late', min: 600, max: null },
] as const
const STAGE_SAMPLE_MIN = 100
const TOP_PER_STAGE = 6
const ITEM_URL = 'https://api.deadlock-api.com/v1/analytics/item-stats'
const HERO_URL = 'https://api.deadlock-api.com/v1/analytics/hero-stats'
const FETCH_OPTS = { retry: 2, retryDelay: 400, timeout: 20000 } as const

function parseHeroId(event: H3Event): number | null {
  const raw = getQuery(event).hero_id
  const value = Array.isArray(raw) ? raw[0] : raw
  // Strict: Number() rejects "1.5"/"1abc" (parseInt would coerce them to 1).
  const id = Number(String(value ?? '').trim())
  return Number.isInteger(id) && id > 0 ? id : null
}

// Wilson score 95% interval for a win proportion — reliable on small samples
// (avoids the false precision of a raw point estimate).
function wilson(wins: number, n: number): [number, number] {
  if (n === 0) return [0, 0]
  const z = 1.96
  const p = wins / n
  const d = 1 + (z * z) / n
  const center = (p + (z * z) / (2 * n)) / d
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d
  return [Math.max(0, center - margin), Math.min(1, center + margin)]
}

// Rank a stage's items by pick rate; annotate lift vs baseline + significance.
function rankStage(
  rows: RawItemStat[],
  heroMatches: number | null,
  baseline: number | null,
): StageItem[] {
  return rows
    .filter((r) => r.matches >= STAGE_SAMPLE_MIN)
    .map((r) => {
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
    // Pick rate is the honest "what players choose" signal; fall back to win
    // rate only when the hero baseline/denominator is unavailable.
    .sort((a, b) => (b.pickRate ?? b.winRate) - (a.pickRate ?? a.winRate))
    .slice(0, TOP_PER_STAGE)
}

export default defineCachedEventHandler(
  async (event) => {
    const heroId = parseHeroId(event)
    if (heroId == null) return { early: [], mid: [], late: [], baseline: null }

    // Baseline win rate + total matches for this hero (lift + pick-rate denom).
    const baseStat = await $fetch<RawHeroStat[]>(HERO_URL, {
      query: { game_mode: 'street_brawl' },
      ...FETCH_OPTS,
    })
      .then((rows) => rows.find((h) => h.hero_id === heroId) ?? null)
      .catch(() => null)
    const heroMatches = baseStat?.matches ?? null
    const baseline =
      baseStat && baseStat.matches > 0 ? baseStat.wins / baseStat.matches : null

    const results = await Promise.all(
      STAGES.map((stage) => {
        const query: Record<string, string> = {
          game_mode: 'street_brawl',
          hero_id: String(heroId),
          min_matches: '20',
        }
        if (stage.min != null) query.min_bought_at_s = String(stage.min)
        if (stage.max != null) query.max_bought_at_s = String(stage.max)
        return $fetch<RawItemStat[]>(ITEM_URL, { query, ...FETCH_OPTS })
          .then((rows) => rankStage(rows, heroMatches, baseline))
          .catch(() => [] as StageItem[])
      }),
    )

    return { early: results[0], mid: results[1], late: results[2], baseline }
  },
  {
    maxAge: 60 * 30,
    getKey: (event) => `sb-stage-items-v2-${parseHeroId(event) ?? 'none'}`,
  },
)
