// Shared UI i18n + display helpers. Two-locale dictionary: UI chrome is
// Traditional Chinese in zh mode; item/hero data names come bilingually from the
// API. Both the shell (app.vue) and the pages read the same `locale` cookie, so
// switching language anywhere updates everywhere.
const messages = {
  en: {
    // chrome
    tagline: 'Learn any Deadlock hero — abilities, builds, and how to actually play them. Data from',
    footerText: 'Community project — not affiliated with Valve; Deadlock and all assets © Valve. Data via the open-source',
    // grid
    gridSubtitle: 'Pick a hero to learn',
    searchHero: 'Search hero…',
    filterAll: 'All',
    startHere: 'Start here',
    roleMarksman: 'Marksman',
    roleMystic: 'Mystic',
    roleBrawler: 'Brawler',
    roleAssassin: 'Assassin',
    difficulty: 'Difficulty',
    // hero detail chrome
    back: 'Heroes',
    tabGuide: '6v6 Guide',
    tabBrawl: 'Street Brawl',
    verifiedAs: 'Data as of {date}',
    // §1 abilities
    abilities: 'Abilities',
    abilitiesModeNote:
      'The ability kit and values are the same in both modes. Street Brawl applies small global tweaks (e.g. ability/item range −10% in the latest patch).',
    abilityTier: 'T{n}',
    upgradeOrder: 'Most-used leveling order',
    upgradeOrderHint:
      'The ability-point order most 6v6 players use on this hero, with its usage and win rate — a reference for what to level first.',
    pickLabel: 'used by',
    winLabel: 'win',
    noOrderData: 'Not enough leveling data for this hero yet.',
    // §2 builds
    builds: 'Recommended builds',
    buildsHint:
      'Top community builds players actually run in 6v6, ranked by real win rate (not author favorites). Each item shows where it fits; tap any item for details.',
    noBuilds: 'No build data for this hero yet.',
    archWeapon: 'Weapon',
    archSpirit: 'Spirit',
    archTank: 'Tank',
    archHybrid: 'Hybrid',
    buildBy: 'community build',
    coreItems: 'Items',
    // §3 teaching
    play: 'How to play & improve',
    winCondition: 'Win condition',
    powerCurve: 'Power curve',
    pcEarly: 'Early',
    pcMid: 'Mid',
    pcLate: 'Late',
    coreCombo: 'Core combo',
    commonMistakes: 'Common mistakes',
    mistakeFix: 'Do this',
    teachSoon: 'The play-and-improve guide for this hero is coming soon.',
    teachDraft: 'Draft — being verified against sources before it is final.',
    teachSources: 'Verified against',
    // brawl tab (existing reference panels)
    modeCopilot: 'Draft co-pilot',
    modeReference: 'Reference',
    loadingStats: 'Loading {hero} data…',
    bestByStage: 'Most-picked items by stage',
    stageEarly: 'Early · 0-5 min',
    stageMid: 'Mid · 5-10 min',
    stageLate: 'Late · 10 min+',
    stageHint:
      'Ranked by how often players pick each item at that stage (% = pick rate). The colored number is win-rate lift vs this hero’s average: green = beats it, red = below it, grey = within noise.',
    liftTitle: 'Win rate vs this hero’s average (green = above, red = below, grey = not significant)',
    loadout: 'Typical Street Brawl loadout',
    loadoutTotal: '{n} items',
    loadoutHint:
      'The items players most often run on this hero in Street Brawl, laid into the 4/4/4 slots they fit. Colored % = win-rate lift vs the hero’s average.',
    slotWeapon: 'Weapon',
    slotVitality: 'Vitality',
    slotSpirit: 'Spirit',
    // tip popover
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
    tapInfo: 'Tap for details',
    close: 'Close',
  },
  zh: {
    tagline: '學會任何 Deadlock 英雄 — 技能、出裝、以及實際怎麼玩。資料來自',
    footerText: '社群專案 — 與 Valve 無關；Deadlock 及所有素材版權屬 Valve。資料來自開源的',
    gridSubtitle: '選擇英雄開始學習',
    searchHero: '搜尋英雄…',
    filterAll: '全部',
    startHere: '新手推薦',
    roleMarksman: '槍手',
    roleMystic: '法系',
    roleBrawler: '鬥士',
    roleAssassin: '刺客',
    difficulty: '難度',
    back: '英雄列表',
    tabGuide: '6v6 攻略',
    tabBrawl: '街頭鬥毆',
    verifiedAs: '資料更新於 {date}',
    abilities: '技能',
    abilitiesModeNote:
      '兩種模式的技能與數值相同。Street Brawl 會套用少量全域微調（例如最新版本技能／物品範圍 −10%）。',
    abilityTier: 'T{n}',
    upgradeOrder: '常見升級順序',
    upgradeOrderHint:
      '6v6 中此英雄最多玩家採用的技能點順序（含使用率與勝率）。可參考先點哪個技能。',
    pickLabel: '使用率',
    winLabel: '勝率',
    noOrderData: '此英雄的升級資料尚不足。',
    builds: '推薦出裝',
    buildsHint:
      '6v6 中玩家實際採用、依真實勝率排序的熱門社群出裝（非作者收藏數）。每件物品標示所屬欄位；點擊可看詳情。',
    noBuilds: '此英雄尚無出裝資料。',
    archWeapon: '武器',
    archSpirit: '元靈',
    archTank: '坦克',
    archHybrid: '混合',
    buildBy: '社群出裝',
    coreItems: '物品',
    play: '玩法與進步',
    winCondition: '致勝關鍵',
    powerCurve: '強勢曲線',
    pcEarly: '前期',
    pcMid: '中期',
    pcLate: '後期',
    coreCombo: '核心連招',
    commonMistakes: '常見錯誤',
    mistakeFix: '正確做法',
    teachSoon: '此英雄的玩法與進步指南即將推出。',
    teachDraft: '草稿 — 正在依來源驗證中，尚未定稿。',
    teachSources: '驗證來源',
    modeCopilot: '抽選助手',
    modeReference: '資料參考',
    loadingStats: '正在載入 {hero} 的數據…',
    bestByStage: '各階段熱門選擇',
    stageEarly: '前期 · 0-5 分',
    stageMid: '中期 · 5-10 分',
    stageLate: '後期 · 10 分以上',
    stageHint:
      '依玩家在該階段選用的頻率排序（% = 選用率）。彩色數字是相對此英雄平均勝率的差值：綠＝高於、紅＝低於、灰＝在誤差範圍內。',
    liftTitle: '相對此英雄平均勝率的差值（綠＝高於、紅＝低於、灰＝不顯著）',
    loadout: 'Street Brawl 典型配置',
    loadoutTotal: '{n} 件',
    loadoutHint:
      '此英雄在 Street Brawl 中最常選用的物品，依其所屬的 4／4／4 欄位排好。彩色 % = 相對此英雄平均勝率的差值。',
    slotWeapon: '武器',
    slotVitality: '生命',
    slotSpirit: '元靈',
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
    tapInfo: '點擊查看詳情',
    close: '關閉',
  },
} as const

export type LocaleKey = keyof typeof messages.en

export function useUi() {
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
  // Display in the active locale only (fall back to English if untranslated).
  function dispName(en: string, zh: string | null): string {
    return locale.value === 'zh' ? zh ?? en : en
  }
  function zhAware(en: string | null, zh: string | null): string | null {
    return locale.value === 'zh' ? zh ?? en : en
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
  function formatSouls(value: number): string {
    return value.toLocaleString('en-US')
  }

  return { locale, t, dispName, zhAware, formatPct, formatLift, formatCount, formatSouls }
}
