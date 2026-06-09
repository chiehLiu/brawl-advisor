// Draft recognition: read the 3 offered item NAMES off a captured frame and map
// them to catalog items. Validated approach (see notes): OCR the printed names
// (NOT the icons — in-game glow/rarity frames corrupt icon matching) and fuzzy-
// match against the ~173-name catalog. A multi-channel pass (grayscale → invert
// → blue channel) handles glow: RARE items have green text on a green glow that
// only separates in the blue channel.
import { createWorker, PSM, type Worker } from 'tesseract.js'
import type { Item } from './deadlock'

export interface NameEntry {
  id: number
  name: string
  slot: Item['slot']
  norm: string // lowercased english name for matching
}
export interface Detected {
  id: number
  name: string
  slot: Item['slot']
  score: number // 0..1 fuzzy confidence
}

export function buildNameIndex(items: Item[]): NameEntry[] {
  return items.map((i) => ({ id: i.id, name: i.name, slot: i.slot, norm: i.name.toLowerCase() }))
}

// ─── Fuzzy match: Sørensen–Dice over character bigrams. Robust to OCR slips
// ("cooidown" → "cooldown") and fast enough to scan 173 names per phrase. ───
function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>()
  const t = s.replace(/\s+/g, ' ').trim()
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2)
    m.set(g, (m.get(g) ?? 0) + 1)
  }
  return m
}
function dice(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const A = bigrams(a)
  const B = bigrams(b)
  let inter = 0
  let total = 0
  for (const v of A.values()) total += v
  for (const v of B.values()) total += v
  for (const [g, c] of A) {
    const d = B.get(g)
    if (d) inter += Math.min(c, d)
  }
  return (2 * inter) / total
}

// Pull candidate phrases out of raw OCR text: each cleaned line, plus sliding
// 1–3 word windows (item names are 1–3 words). Dedup.
function extractPhrases(text: string): string[] {
  const out = new Set<string>()
  for (const raw of text.split('\n')) {
    const line = raw.replace(/[^A-Za-z \-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
    if (line.length >= 4) out.add(line)
    const w = line.split(' ').filter(Boolean)
    for (let i = 0; i < w.length; i++) {
      for (let n = 1; n <= 3 && i + n <= w.length; n++) {
        const p = w.slice(i, i + n).join(' ')
        if (p.length >= 4) out.add(p)
      }
    }
  }
  return [...out]
}

// ─── Image preprocessing: scale to a good OCR size, return single-channel
// grayscale variants (each autocontrast-stretched). ───
const TARGET_MAX_DIM = 1600
type Variant = 'gray' | 'invert' | 'blue'

function toVariant(source: CanvasImageSource, srcW: number, srcH: number, variant: Variant): HTMLCanvasElement {
  // Upscale small/cropped frames so label text is OCR-sized; never downscale a
  // big live capture below native (a 1080p+ frame stays as-is).
  const scale = Math.min(3, Math.max(1, TARGET_MAX_DIM / Math.max(srcW, srcH)))
  const w = Math.round(srcW * scale)
  const h = Math.round(srcH * scale)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(source, 0, 0, w, h)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  // build single channel + track min/max for autocontrast
  let min = 255
  let max = 0
  const lum = new Float32Array(w * h)
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let v: number
    if (variant === 'blue') v = d[i + 2]!
    else v = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!
    if (variant === 'invert') v = 255 - v
    lum[p] = v
    if (v < min) min = v
    if (v > max) max = v
  }
  const range = max - min || 1
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = ((lum[p]! - min) / range) * 255
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

// ─── Worker singleton (lazy). First call downloads wasm + eng data (~a few MB). ───
let workerPromise: Promise<Worker> | null = null
export function initRecognizer(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng')
      .then(async (w) => {
        // SPARSE_TEXT: find scattered text anywhere — the draft labels aren't a
        // document page, so the default (PSM 3) reads almost nothing.
        await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })
        return w
      })
      .catch((e) => {
        // Don't cache a rejected init — a transient failure must not poison
        // every future scan. Reset so the next call retries.
        workerPromise = null
        throw e
      })
  }
  return workerPromise
}
export async function disposeRecognizer(): Promise<void> {
  const p = workerPromise
  workerPromise = null
  if (p) {
    try {
      await (await p).terminate()
    } catch {
      /* already failed/terminated */
    }
  }
}

const MATCH_CUTOFF = 0.6
const WANT = 3 // a Street Brawl round offers 3

// Recognize the offered items in a frame. Runs grayscale first; only adds the
// invert + blue-channel passes if it hasn't found the full set yet (keeps the
// common case to a single OCR pass).
export async function recognizeItems(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  index: NameEntry[],
): Promise<Detected[]> {
  const worker = await initRecognizer()
  const hits = new Map<number, Detected>()

  const runPass = async (variant: Variant) => {
    const canvas = toVariant(source, srcW, srcH, variant)
    const { data } = await worker.recognize(canvas)
    for (const phrase of extractPhrases(data.text)) {
      let best: NameEntry | null = null
      let bestScore = 0
      for (const e of index) {
        const s = dice(phrase, e.norm)
        if (s > bestScore) {
          bestScore = s
          best = e
        }
      }
      if (best && bestScore >= MATCH_CUTOFF) {
        const cur = hits.get(best.id)
        if (!cur || bestScore > cur.score) {
          hits.set(best.id, {
            id: best.id,
            name: best.name,
            slot: best.slot,
            score: Math.round(bestScore * 100) / 100,
          })
        }
      }
    }
  }

  await runPass('gray')
  if (hits.size < WANT) await runPass('invert')
  if (hits.size < WANT) await runPass('blue')

  return [...hits.values()].sort((a, b) => b.score - a.score)
}
