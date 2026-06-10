<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { Hero, Item } from '~/lib/deadlock'
import {
  fetchHeroDraftModel,
  rankPicks,
  DRAFT_SLOT_CAP,
  type HeroDraftModel,
  type ScoredPick,
} from '~/lib/copilot'
import { buildNameIndex, recognizeItems, type RecognizeDebug, type Detected } from '~/lib/recognize'

const props = defineProps<{ hero: Hero | null; items: Item[]; locale: 'en' | 'zh' }>()

// Self-contained tiny dictionary (component is isolated from the parent's t()).
const DICT = {
  en: {
    loading: 'Loading draft data…',
    noModel: 'No Street Brawl draft data for this hero yet.',
    yourBuild: 'Your build',
    round: 'Round {n}',
    empty: '— empty —',
    pick: 'PICK',
    take: 'Take it',
    override: 'tap any to take instead',
    clear: 'Clear round',
    reset: 'Reset build',
    prompt: 'Tap the items the game is offering you this round (up to 3):',
    poolHint: 'The items players actually run on this hero — grouped by slot.',
    scanBtn: 'Scan game screen',
    scanStop: 'Stop scanning',
    scanStarting: 'Watching the draft…',
    scanFound: 'detected {n}',
    scanNone: 'no items detected yet',
    scanUnsupported: 'Screen capture is not supported in this browser.',
    scanDenied: 'Screen share was cancelled.',
    scanHint:
      'Share your Deadlock window once — it auto-detects the offered items each round (then tap the one you take). Borderless-windowed works best.',
    photoBtn: 'Scan a photo',
    photoReading: 'Reading photo…',
    scanBusy: 'Busy — tap the photo again.',
    photoHint: 'On a phone: take a photo of the draft screen, or pick a screenshot.',
    slot: { weapon: 'Weapon', vitality: 'Vitality', spirit: 'Spirit' },
    why: {
      fillSlot: 'fills an empty slot',
      redundant: 'you already have a similar item',
      synergy: 'combos with your build',
      winEdge: 'real win-rate edge',
      popular: 'most-picked of these',
      slotFull: 'this slot is full',
      bestOfRound: 'best of what you were offered',
    } as Record<string, string>,
  },
  zh: {
    loading: '載入抽選資料中…',
    noModel: '此英雄尚無 Street Brawl 抽選資料。',
    yourBuild: '你的配置',
    round: '第 {n} 回合',
    empty: '— 空 —',
    pick: '選這個',
    take: '採用',
    override: '點任一項可改選',
    clear: '清除本回合',
    reset: '重設配置',
    prompt: '點選遊戲這回合給你的物品（最多 3 個）：',
    poolHint: '此英雄玩家實際會用的物品 — 依欄位分組。',
    scanBtn: '掃描遊戲畫面',
    scanStop: '停止掃描',
    scanStarting: '正在偵測抽選畫面…',
    scanFound: '偵測到 {n} 件',
    scanNone: '尚未偵測到物品',
    scanUnsupported: '此瀏覽器不支援畫面擷取。',
    scanDenied: '已取消畫面分享。',
    scanHint:
      '分享你的 Deadlock 視窗一次，之後每回合會自動偵測提供的物品（再點你拿的那件）。建議用無邊框視窗模式。',
    photoBtn: '掃描照片',
    photoReading: '辨識照片中…',
    scanBusy: '忙碌中，請再點一次照片。',
    photoHint: '手機上：拍一張抽選畫面的照片，或選一張截圖。',
    slot: { weapon: '武器', vitality: '生命', spirit: '元靈' },
    why: {
      fillSlot: '補上空欄位',
      redundant: '你已有同類物品',
      synergy: '與現有配置相輔相成',
      winEdge: '勝率確實較高',
      popular: '三者中最多人選',
      slotFull: '此欄位已滿',
      bestOfRound: '本回合相對最佳',
    } as Record<string, string>,
  },
}
const d = computed(() => DICT[props.locale])
function dispName(en: string, zh: string | null): string {
  return props.locale === 'zh' ? zh ?? en : en
}
function reasonText(tag: string): string {
  return d.value.why[tag] ?? tag
}
// The recommendation card explains WHY this is the pick — so it shows only the
// positive cues (in priority order). Penalty cues (redundant / slot full) are
// why an item scored LOW, not a reason to take it; showing them on the winner
// reads as a contradiction. If nothing positive stands out, say it plainly.
const POSITIVE_REASONS = ['winEdge', 'synergy', 'fillSlot', 'popular']
function pickReasons(reasons: string[]): string[] {
  const pos = reasons
    .filter((r) => POSITIVE_REASONS.includes(r))
    .sort((a, b) => POSITIVE_REASONS.indexOf(a) - POSITIVE_REASONS.indexOf(b))
  return pos.length ? pos : ['bestOfRound']
}
function fmtLift(v: number | null): string {
  if (v == null) return ''
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%'
}

const SLOTS = ['weapon', 'vitality', 'spirit'] as const

const model = ref<HeroDraftModel | null>(null)
const loading = ref(false)
const build = ref<Item[]>([])
const offered = ref<Item[]>([])

let reqId = 0
// Bumped on every hero change / scan stop / unmount; an in-flight OCR compares
// against it after awaiting and bails if it's stale (so an old frame can't
// repopulate `offered` for a freshly-selected hero). Declared before the watch
// to stay out of the immediate-run temporal-dead-zone.
let scanGen = 0
watch(
  () => props.hero?.id,
  async (id) => {
    const mine = ++reqId
    scanGen++
    model.value = null
    build.value = []
    offered.value = []
    // Clearing the hero must also clear loading — a stale in-flight response
    // bails on the token check below and would otherwise leave it stuck true.
    if (id == null) {
      loading.value = false
      return
    }
    loading.value = true
    const m = await fetchHeroDraftModel(id).catch(() => null)
    if (mine === reqId) {
      model.value = m
      loading.value = false
    }
  },
  { immediate: true },
)

const byId = computed(() => new Map(props.items.map((i) => [i.id, i])))

// Draftable pool = items with reliable stats, resolved to the catalog.
const pool = computed(() => {
  const out: { item: Item; pickRate: number }[] = []
  if (!model.value) return out
  for (const [id, st] of model.value.stats) {
    const item = byId.value.get(id)
    if (item) out.push({ item, pickRate: st.pickRate })
  }
  out.sort((a, b) => b.pickRate - a.pickRate)
  return out
})
const poolBySlot = computed(() =>
  SLOTS.map((slot) => ({ slot, items: pool.value.filter((p) => p.item.slot === slot) })).filter(
    (g) => g.items.length,
  ),
)

const buildBySlot = computed(() =>
  SLOTS.map((slot) => ({
    slot,
    items: build.value.filter((b) => b.slot === slot),
    cap: DRAFT_SLOT_CAP[slot],
  })),
)
const round = computed(() => build.value.length + 1)

function isOffered(i: Item): boolean {
  return offered.value.some((o) => o.id === i.id)
}
function isDrafted(i: Item): boolean {
  return build.value.some((b) => b.id === i.id)
}
function toggleOffer(i: Item): void {
  if (isDrafted(i)) return
  const idx = offered.value.findIndex((o) => o.id === i.id)
  if (idx >= 0) offered.value.splice(idx, 1)
  else if (offered.value.length < 3) offered.value.push(i)
}

const ranked = computed<ScoredPick[]>(() =>
  model.value && offered.value.length ? rankPicks(offered.value, build.value, model.value) : [],
)
const recommended = computed(() => ranked.value.find((r) => r.best) ?? null)

function take(item?: Item): void {
  const pick = item ?? recommended.value?.item
  if (!pick) return
  // Never exceed a Brawl slot cap — the game wouldn't let you either.
  if (build.value.filter((b) => b.slot === pick.slot).length >= DRAFT_SLOT_CAP[pick.slot]) return
  build.value.push(pick)
  offered.value = []
  lastDetectedKey = '' // let the scanner re-offer next round's items
}
function clearRound(): void {
  offered.value = []
  lastDetectedKey = ''
}
function resetBuild(): void {
  build.value = []
  offered.value = []
  lastDetectedKey = ''
}

// ─── Screen-scan (phase 2/3): share the Deadlock window once, then every ~1.5s
// grab a frame and OCR the 3 offered item NAMES (validated far more reliable
// than icon matching — in-game glow corrupts icons). Detected items auto-fill
// `offered`, so the recommendation appears hands-free; you still tap to record
// which one you actually took. ───
const SCAN_INTERVAL_MS = 1500
const nameIndex = computed(() => buildNameIndex(props.items))
// Live screen-share is desktop-only: phone browsers don't implement
// getDisplayMedia at all. When it's missing we hide the screen-scan button and
// lean on manual tap + the photo path (which work everywhere).
const scanSupported =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia
const scanning = ref(false)
const scanStatus = ref('')
const scanError = ref('')
const videoEl = ref<HTMLVideoElement | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)
const photoBusy = ref(false)
// Diagnostics: open the app with ?debug (or #debug) to show, under the scan
// area, the captured frame size, brightness, raw OCR text, and matches — so a
// real-game scan that "finds nothing" can be diagnosed from evidence.
const debugOn =
  typeof location !== 'undefined' &&
  (location.search.includes('debug') || location.hash.includes('debug'))
const debugInfo = ref<(RecognizeDebug & { detected: Detected[] }) | null>(null)
let stream: MediaStream | null = null
let scanTimer: ReturnType<typeof setInterval> | null = null
let recognizing = false
let starting = false
let lastDetectedKey = ''
const frameCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null

// Map OCR hits → catalog items still draftable this round, set them as offered.
// Returns false if it bailed before running (worker busy / no frame) so a
// user-initiated photo scan can tell "did nothing" apart from "found nothing".
async function recognizeFromSource(source: CanvasImageSource, w: number, h: number): Promise<boolean> {
  if (recognizing || !w || !h) return false
  recognizing = true
  const myGen = scanGen
  try {
    const dbg: RecognizeDebug | undefined = debugOn
      ? { frameW: 0, frameH: 0, avgLuma: 0, passes: [] }
      : undefined
    const found = await recognizeItems(source, w, h, nameIndex.value, dbg)
    if (dbg) debugInfo.value = { ...dbg, detected: found } // always show what was read
    if (myGen !== scanGen) return true // hero switched / scan stopped / unmounted while OCR ran
    const items = found
      .map((f) => byId.value.get(f.id))
      .filter((i): i is Item => !!i && !isDrafted(i))
      .slice(0, 3)
    scanStatus.value = found.length
      ? d.value.scanFound.replace('{n}', String(found.length))
      : d.value.scanNone
    const key = items.map((i) => i.id).sort().join(',')
    if (items.length && key !== lastDetectedKey) {
      lastDetectedKey = key
      offered.value = items
    }
    return true
  } catch (e) {
    if (myGen === scanGen) scanError.value = String(e)
    return true
  } finally {
    recognizing = false
  }
}

// ─── Photo path: a still image (phone camera or a saved screenshot) through
// the exact same OCR. Works on mobile, where live screen-share is unavailable.
// Noisier than a pixel-perfect screen-share, so it's a best-effort assist. ───
function pickPhoto(): void {
  photoInput.value?.click()
}
async function onPhoto(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // reset so re-picking the same file fires change again
  if (!file) return
  if (typeof createImageBitmap !== 'function') {
    scanError.value = d.value.scanUnsupported
    return
  }
  photoBusy.value = true
  scanError.value = ''
  scanStatus.value = d.value.photoReading
  // Capture the generation BEFORE decoding: if the hero is switched while the
  // bitmap decodes, drop this stale photo instead of applying it to the new hero.
  const myGen = scanGen
  let bmp: ImageBitmap | null = null
  try {
    // imageOrientation: respect EXIF so a rotated phone photo reads upright.
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    if (myGen !== scanGen) return
    const ran = await recognizeFromSource(bmp, bmp.width, bmp.height)
    // Worker was mid-pass (a live scan held it); say so rather than leave "reading".
    if (!ran) scanStatus.value = d.value.scanBusy
  } catch (err) {
    scanError.value = String(err)
  } finally {
    bmp?.close()
    photoBusy.value = false
  }
}

function onShareEnded(): void {
  stopScan()
}

async function startScan(): Promise<void> {
  if (scanning.value || starting) return // ignore double-clicks before the prompt resolves
  starting = true
  scanError.value = ''
  try {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      scanError.value = d.value.scanUnsupported
      return
    }
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    } catch {
      scanError.value = d.value.scanDenied
      return
    }
    scanning.value = true
    scanStatus.value = d.value.scanStarting
    const video = videoEl.value
    if (video) {
      video.srcObject = stream
      await video.play().catch(() => {})
    }
    // stop cleanly if the user ends the share from the browser chrome
    stream.getVideoTracks()[0]?.addEventListener('ended', onShareEnded)
    scanTimer = setInterval(grabAndScan, SCAN_INTERVAL_MS)
  } finally {
    starting = false
  }
}

function grabAndScan(): void {
  if (recognizing) return // don't overwrite the shared canvas while a pass is reading it
  const video = videoEl.value
  if (!video || !frameCanvas || video.videoWidth === 0) return
  const w = video.videoWidth
  const h = video.videoHeight
  frameCanvas.width = w
  frameCanvas.height = h
  frameCanvas.getContext('2d')?.drawImage(video, 0, 0, w, h)
  void recognizeFromSource(frameCanvas, w, h)
}

function stopScan(): void {
  scanGen++ // invalidate any in-flight OCR result
  if (scanTimer) {
    clearInterval(scanTimer)
    scanTimer = null
  }
  stream?.getVideoTracks()[0]?.removeEventListener('ended', onShareEnded)
  stream?.getTracks().forEach((tr) => tr.stop())
  stream = null
  if (videoEl.value) videoEl.value.srcObject = null
  scanning.value = false
  scanStatus.value = ''
}

onBeforeUnmount(stopScan)

// Dev-only: lets me feed a still screenshot through the exact same path to
// validate recognition without a live screen share.
if (import.meta.dev && typeof window !== 'undefined') {
  ;(window as unknown as { __scanImage?: (url: string) => Promise<unknown> }).__scanImage = async (
    url: string,
  ) => {
    const bmp = await fetch(url).then((r) => r.blob()).then(createImageBitmap)
    await recognizeFromSource(bmp, bmp.width, bmp.height)
    return { offered: offered.value.map((i) => i.name), status: scanStatus.value, err: scanError.value }
  }
}
</script>

<template>
  <section class="copilot">
    <p v-if="loading" class="hint">{{ d.loading }}</p>
    <p v-else-if="!model" class="hint">{{ d.noModel }}</p>
    <template v-else>
      <!-- capture: live screen-share (desktop) and/or a still photo (anywhere) -->
      <div class="cp-scan">
        <button
          v-if="scanSupported"
          class="cp-scan-btn"
          :class="{ live: scanning }"
          @click="scanning ? stopScan() : startScan()"
        >
          {{ scanning ? d.scanStop : d.scanBtn }}
        </button>
        <button class="cp-scan-btn" :disabled="photoBusy" @click="pickPhoto">{{ d.photoBtn }}</button>
        <input ref="photoInput" type="file" accept="image/*" class="cp-file" @change="onPhoto" />
        <span v-if="scanStatus" class="cp-scan-status">● {{ scanStatus }}</span>
        <span v-if="scanError" class="cp-scan-err">{{ scanError }}</span>
        <video v-show="scanning" ref="videoEl" class="cp-video" muted playsinline></video>
      </div>
      <p v-if="scanSupported" class="hint cp-scan-hint">{{ d.scanHint }}</p>
      <p class="hint cp-scan-hint">{{ d.photoHint }}</p>

      <!-- diagnostics (only with ?debug): shows what the scan actually captured/read -->
      <div v-if="debugOn && debugInfo" class="cp-debug">
        <div class="cp-debug-row">
          frame {{ debugInfo.frameW }}×{{ debugInfo.frameH }} · brightness {{ debugInfo.avgLuma }}/255
          <span v-if="debugInfo.avgLuma >= 0 && debugInfo.avgLuma < 8" class="cp-debug-warn">
            ⚠ near-black — game may be in exclusive Fullscreen (use Borderless Windowed)
          </span>
        </div>
        <div class="cp-debug-row">
          matched:
          {{
            debugInfo.detected.length
              ? debugInfo.detected.map((x) => x.name + ' (' + x.score + ')').join(', ')
              : '(none)'
          }}
        </div>
        <details>
          <summary>raw OCR text — {{ debugInfo.passes.length }} pass(es)</summary>
          <pre v-for="p in debugInfo.passes" :key="p.variant">[{{ p.variant }}] {{ p.text || '(empty)' }}</pre>
        </details>
      </div>

      <!-- build so far -->
      <div class="cp-build">
        <div class="cp-build-head">
          <strong>{{ d.yourBuild }}</strong>
          <span class="cp-round">{{ d.round.replace('{n}', String(round)) }}</span>
        </div>
        <div class="cp-build-slots">
          <div v-for="g in buildBySlot" :key="g.slot" class="cp-build-slot">
            <span class="slot" :class="g.slot">{{ d.slot[g.slot] }} {{ g.items.length }}/{{ g.cap }}</span>
            <div class="cp-build-items">
              <img
                v-for="b in g.items"
                :key="b.id"
                :src="b.image || undefined"
                :alt="b.name"
                class="item-icon"
                :class="b.slot"
                :title="dispName(b.name, b.nameZh)"
              />
              <span v-if="!g.items.length" class="cp-empty">{{ d.empty }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- recommendation -->
      <div v-if="recommended" class="cp-rec" :class="recommended.item.slot">
        <span class="cp-rec-label">{{ d.pick }}</span>
        <img
          v-if="recommended.item.image"
          :src="recommended.item.image"
          :alt="recommended.item.name"
          class="item-icon cp-rec-icon"
          :class="recommended.item.slot"
        />
        <div class="cp-rec-text">
          <strong>{{ dispName(recommended.item.name, recommended.item.nameZh) }}</strong>
          <span class="cp-reasons">{{ pickReasons(recommended.reasons).map(reasonText).join(' · ') }}</span>
        </div>
        <button class="cp-take" @click="take()">{{ d.take }}</button>
      </div>

      <!-- ranked offered (tap any to take that one instead) -->
      <div v-if="ranked.length > 1" class="cp-ranked">
        <span class="cp-override">{{ d.override }}</span>
        <button
          v-for="r in ranked"
          :key="r.item.id"
          class="cp-rank-item"
          :class="{ best: r.best }"
          @click="take(r.item)"
        >
          <img
            v-if="r.item.image"
            :src="r.item.image"
            :alt="r.item.name"
            class="item-icon"
            :class="r.item.slot"
          />
          <span class="cp-rank-name">{{ dispName(r.item.name, r.item.nameZh) }}</span>
          <span v-if="r.winLift != null" class="stage-lift" :class="r.sig">{{ fmtLift(r.winLift) }}</span>
        </button>
      </div>

      <!-- offered input prompt -->
      <p class="cp-prompt">{{ d.prompt }}</p>
      <div class="cp-actions">
        <button v-if="offered.length" class="cp-mini" @click="clearRound">{{ d.clear }}</button>
        <button v-if="build.length" class="cp-mini" @click="resetBuild">{{ d.reset }}</button>
      </div>

      <!-- draftable pool, grouped by slot -->
      <div class="cp-pool">
        <div v-for="g in poolBySlot" :key="g.slot" class="cp-pool-slot">
          <span class="slot" :class="g.slot">{{ d.slot[g.slot] }}</span>
          <div class="cp-pool-items">
            <button
              v-for="p in g.items"
              :key="p.item.id"
              class="cp-pool-item"
              :class="{ offered: isOffered(p.item), drafted: isDrafted(p.item) }"
              :disabled="isDrafted(p.item)"
              :title="dispName(p.item.name, p.item.nameZh)"
              @click="toggleOffer(p.item)"
            >
              <img
                v-if="p.item.image"
                :src="p.item.image"
                :alt="p.item.name"
                class="item-icon"
                :class="p.item.slot"
              />
              <span v-else class="item-icon fallback" :class="p.item.slot">{{ p.item.name[0] }}</span>
            </button>
          </div>
        </div>
      </div>
      <p class="hint">{{ d.poolHint }}</p>
    </template>
  </section>
</template>

<style scoped>
.copilot {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.cp-scan {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.cp-scan-btn {
  background: #1c1814;
  border: 1px solid #4a4138;
  color: #f4efe7;
  border-radius: 8px;
  padding: 0.45rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.cp-scan-btn.live {
  border-color: #e05a5a;
  color: #f0a0a0;
}
.cp-scan-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.cp-file {
  display: none;
}
.cp-debug {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.72rem;
  line-height: 1.4;
  background: #0c0a08;
  border: 1px solid #3a3128;
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  color: #b8b0a4;
  margin-top: -0.4rem;
}
.cp-debug-row {
  word-break: break-word;
  margin-bottom: 0.3rem;
}
.cp-debug-warn {
  color: #e08a8a;
}
.cp-debug summary {
  cursor: pointer;
  color: #f2c879;
}
.cp-debug pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0.35rem 0 0;
  max-height: 9rem;
  overflow: auto;
  color: #cfc7ba;
}
.cp-scan-status {
  color: #8fc78f;
  font-size: 0.82rem;
}
.cp-scan-err {
  color: #e08a8a;
  font-size: 0.82rem;
}
.cp-video {
  width: 168px;
  height: 95px;
  object-fit: contain;
  border: 1px solid #2e2822;
  border-radius: 6px;
  background: #000;
  margin-left: auto;
}
.cp-scan-hint {
  margin-top: -0.4rem;
}
.cp-build {
  background: #15110d;
  border: 1px solid #2e2822;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
}
.cp-build-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}
.cp-round {
  color: #f2c879;
  font-size: 0.85rem;
}
.cp-build-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}
.cp-build-slot {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.cp-build-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-height: 26px;
}
.cp-empty {
  color: #5c554b;
  font-size: 0.82rem;
}
/* recommendation card */
.cp-rec {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  border: 1px solid #4a3a1e;
  background: linear-gradient(90deg, rgba(242, 200, 121, 0.12), rgba(242, 200, 121, 0.02));
}
.cp-rec-label {
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f2c879;
  font-size: 0.82rem;
  flex-shrink: 0;
}
.cp-rec-icon {
  width: 42px;
  height: 42px;
}
.cp-rec-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}
.cp-rec-text strong {
  font-size: 1.05rem;
  color: #f4efe7;
}
.cp-reasons {
  color: #9c9488;
  font-size: 0.82rem;
}
.cp-take {
  flex-shrink: 0;
  background: #f2c879;
  color: #1a1611;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
.cp-take:hover {
  background: #f7d695;
}
/* ranked list */
.cp-ranked {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.cp-override {
  color: #5c554b;
  font-size: 0.78rem;
  margin-right: 0.2rem;
}
.cp-rank-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #161210;
  border: 1px solid #2e2822;
  border-radius: 8px;
  padding: 0.25rem 0.5rem 0.25rem 0.3rem;
  cursor: pointer;
  color: #cfc7ba;
}
.cp-rank-item.best {
  border-color: #f2c879;
  background: rgba(242, 200, 121, 0.08);
}
.cp-rank-name {
  font-size: 0.85rem;
}
.cp-prompt {
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
  color: #cfc7ba;
}
.cp-actions {
  display: flex;
  gap: 0.5rem;
}
.cp-mini {
  background: #1c1814;
  border: 1px solid #2e2822;
  color: #9c9488;
  border-radius: 7px;
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.cp-mini:hover {
  color: #e8e2d9;
}
/* pool */
.cp-pool {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.cp-pool-slot {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.cp-pool-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.cp-pool-item {
  background: #161210;
  border: 1px solid #2e2822;
  border-radius: 8px;
  padding: 0.2rem;
  cursor: pointer;
  line-height: 0;
  transition: border-color 0.12s;
}
.cp-pool-item:hover {
  border-color: #4a4138;
}
.cp-pool-item.offered {
  border-color: #f2c879;
  box-shadow: 0 0 0 1px #f2c879 inset;
}
.cp-pool-item.drafted {
  opacity: 0.32;
  cursor: default;
}
@media (max-width: 560px) {
  .cp-build-slots {
    grid-template-columns: 1fr;
  }
}
</style>
