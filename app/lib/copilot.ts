// Draft co-pilot brain. Given a hero, the items already drafted, and the items
// offered this round, it ranks the offered items and recommends the best pick.
//
// It blends four REAL signals from deadlock-api (game_mode=street_brawl):
//   • pick rate   — how often players take the item on this hero (the prior)
//   • win lift    — win rate vs the hero's baseline, Wilson-significant (quality)
//   • slot need   — Brawl caps each slot at 4; fill empty slots, don't overfill
//   • redundancy  — don't take a second ALTERNATIVE of something you already own
// plus a small bonus when an item genuinely combos (co-occurrence lift > 1.1).
//
// Validated against simulated Abrams drafts before wiring into the UI.
import { ofetch } from 'ofetch'
import type { Item } from './deadlock'

const V1 = 'https://api.deadlock-api.com/v1'
const FETCH_OPTS = { retry: 2, retryDelay: 400, timeout: 20000 } as const

// Brawl slot caps. No soul economy — the only hard limit is slots.
export const DRAFT_SLOT_CAP: Record<Item['slot'], number> = { weapon: 4, vitality: 4, spirit: 4 }

// Tuning weights (kept as named constants so the policy is legible/tweakable).
// Quality rides on the Wilson SIGNIFICANCE flag, not the raw win-lift number:
// a +2% lift over 12k games is a real edge, a +2% over 200 games is noise — the
// significance test already separates them, so we reward the verdict, not the %.
const W = {
  sigPos: 1.25, // item beats the hero baseline (Wilson-significant) → boost
  sigNeg: 0.85, // item is below baseline (Wilson-significant) → discount
  needEmpty: 1.3, // empty slot → prefer filling it
  needFull: 0.12, // slot already capped → strongly avoid
  redundant: 0.6, // already own a same-slot substitute → discount
  synergy: 1.15, // genuinely combos with the current build
  substituteMaxLift: 0.85, // co-occurrence lift below this = "alternative", not combo
  synergyMinLift: 1.1, // mean co-occurrence lift above this = real synergy
  minMatches: 100, // ignore items below this sample size as unreliable
}

export interface DraftStat {
  matches: number
  pickRate: number
  winRate: number
  winLift: number
  sig: 'pos' | 'neg' | 'neutral'
}
export interface HeroDraftModel {
  heroMatches: number
  baseline: number
  stats: Map<number, DraftStat> // itemId → stats (only reliable items)
  co: Map<string, number> // "a-b" (a<b) → games that ran both
}
export interface ScoredPick {
  item: Item
  score: number
  pickRate: number | null
  winLift: number | null
  sig: 'pos' | 'neg' | 'neutral'
  best: boolean
  reasons: string[] // short human cues for WHY (localised by the caller's tags)
}

function wilson(wins: number, n: number): [number, number] {
  if (n === 0) return [0, 0]
  const z = 1.96
  const p = wins / n
  const d = 1 + (z * z) / n
  const center = (p + (z * z) / (2 * n)) / d
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d
  return [Math.max(0, center - margin), Math.min(1, center + margin)]
}

const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

// Fetch everything the brain needs for one hero: per-item stats + co-occurrence.
export async function fetchHeroDraftModel(heroId: number): Promise<HeroDraftModel | null> {
  const [heroRows, itemRows, pairRows] = await Promise.all([
    ofetch<{ hero_id: number; wins: number; matches: number }[]>(`${V1}/analytics/hero-stats`, {
      query: { game_mode: 'street_brawl' },
      ...FETCH_OPTS,
    }).catch(() => [] as { hero_id: number; wins: number; matches: number }[]),
    ofetch<{ item_id: number; wins: number; matches: number }[]>(`${V1}/analytics/item-stats`, {
      query: { game_mode: 'street_brawl', hero_id: String(heroId), min_matches: '20' },
      ...FETCH_OPTS,
    }).catch(() => [] as { item_id: number; wins: number; matches: number }[]),
    ofetch<{ item_ids: number[]; matches: number }[]>(
      `${V1}/analytics/item-permutation-stats`,
      { query: { game_mode: 'street_brawl', hero_id: heroId, comb_size: 2 }, ...FETCH_OPTS },
    ).catch(() => [] as { item_ids: number[]; matches: number }[]),
  ])

  const hero = heroRows.find((h) => h.hero_id === heroId)
  if (!hero || hero.matches === 0) return null
  const baseline = hero.wins / hero.matches

  const stats = new Map<number, DraftStat>()
  for (const r of itemRows) {
    if (r.matches < W.minMatches) continue
    const winRate = r.wins / r.matches
    const [lo, hi] = wilson(r.wins, r.matches)
    const sig: DraftStat['sig'] = lo > baseline ? 'pos' : hi < baseline ? 'neg' : 'neutral'
    stats.set(r.item_id, {
      matches: r.matches,
      pickRate: r.matches / hero.matches,
      winRate,
      winLift: winRate - baseline,
      sig,
    })
  }

  const co = new Map<string, number>()
  for (const r of pairRows) {
    const [a, b] = r.item_ids ?? []
    if (a !== undefined && b !== undefined) co.set(pairKey(a, b), r.matches)
  }
  return { heroMatches: hero.matches, baseline, stats, co }
}

// Co-occurrence lift: observed / expected-if-independent. >1 = run together more
// than chance (combo); <1 = run together less (alternatives / competing slots).
function coLift(model: HeroDraftModel, a: number, b: number): number {
  const ma = model.stats.get(a)?.matches ?? 0
  const mb = model.stats.get(b)?.matches ?? 0
  const both = model.co.get(pairKey(a, b)) ?? 0
  return ma && mb ? (both * model.heroMatches) / (ma * mb) : 0
}

// Rank a set of offered items given the current build. Returns them sorted best
// first, with the top one flagged and short reason cues attached.
export function rankPicks(offered: Item[], build: Item[], model: HeroDraftModel): ScoredPick[] {
  const scored = offered.map((item): ScoredPick => {
    const st = model.stats.get(item.id)
    const pickRate = st?.pickRate ?? 0
    const winLift = st?.winLift ?? 0
    const sig = st?.sig ?? 'neutral'
    const reasons: string[] = []

    // value: popularity (the prior) scaled by the significance verdict (quality)
    const sigMult = sig === 'pos' ? W.sigPos : sig === 'neg' ? W.sigNeg : 1
    const value = pickRate * sigMult

    // slot need
    const owned = build.filter((b) => b.slot === item.slot)
    let need = 1
    if (owned.length >= DRAFT_SLOT_CAP[item.slot]) {
      need = W.needFull
      reasons.push('slotFull')
    } else if (owned.length === 0) {
      need = W.needEmpty
      reasons.push('fillSlot')
    }

    // redundancy: do we already own a same-slot ALTERNATIVE of this item?
    const hasSubstitute = owned.some((b) => coLift(model, item.id, b.id) < W.substituteMaxLift)
    const redun = hasSubstitute ? W.redundant : 1
    if (hasSubstitute) reasons.push('redundant')

    // synergy with the existing build
    let syn = 1
    if (build.length) {
      const mean = build.reduce((s, b) => s + coLift(model, item.id, b.id), 0) / build.length
      if (mean > W.synergyMinLift) {
        syn = W.synergy
        reasons.push('synergy')
      }
    }

    if (sig === 'pos') reasons.push('winEdge')
    return {
      item,
      score: value * need * redun * syn,
      pickRate: st ? pickRate : null,
      winLift: st ? winLift : null,
      sig,
      best: false,
      reasons,
    }
  })

  scored.sort((a, b) => b.score - a.score)
  const first = scored[0]
  if (!first) return scored
  // "most-picked of the three" cue on the popularity leader
  let topPick = first
  for (const s of scored) if ((s.pickRate ?? 0) > (topPick.pickRate ?? 0)) topPick = s
  if (topPick.pickRate) topPick.reasons.push('popular')
  first.best = true
  return scored
}
