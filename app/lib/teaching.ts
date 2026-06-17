// §3 "How to play & improve" — the written teaching layer. This is the part no
// stats site has, so it is authored, not fetched. Every hero's content was
// drafted from coaching sources and fact-checked (3-vote adversarial) against the
// live game data / deadlock.wiki before `verified` was set true. Bilingual:
// en + zh. Only heroes present here show §3; others show "coming soon".
//
// Generated from the verification workflow output. Re-run + regenerate per patch.
export interface HeroTeaching {
  verified: boolean
  winCondition: string
  powerCurve: { early: string; mid: string; late: string }
  coreCombo: string
  commonMistakes: { mistake: string; fix: string }[]
  sources: string[]
}
export interface HeroTeachingBilingual {
  en: HeroTeaching
  zh: HeroTeaching
}

// Bump on each patch the teaching content is re-verified against.
export const PATCH_LABEL = 'June 11, 2026'

// Beginner-recommended heroes (one per role, all Valve complexity-1). These get
// the full written guide first and a "Start here" badge on the grid.
export const STARTER_HERO_IDS = [6, 1, 2, 7, 8, 13]

// hero id -> verified teaching content.
export const TEACHING: Record<number, HeroTeachingBilingual> = {
  "6": {
    "en": {
      "verified": true,
      "winCondition": "Abrams wins by starting close-range fights and committing to them. He is a frontline brawler/tank: he dives in, sticks to enemies, soaks damage, and out-lasts them with lifesteal and high health while his team follows up his stuns. His real damage comes from his gun and a charged heavy melee after a stun, not from poking at a distance. Use abilities to lock down isolated targets, then finish with weapon fire; do not play safe and far away.",
      "powerCurve": {
        "early": "Early game he is decent but not strong. Level up Infernal Resilience first for health regeneration when you take damage, and use that survivability to win close trades in lane instead of playing passively.",
        "mid": "Mid game is his spike. Put points into Siphon Life (a healing aura that heals him for a large share of the spirit damage it deals) and Shoulder Charge for engage; after mobility/sustain items like Majestic Leap, roam between lanes to gank enemies who are alone or out of position.",
        "late": "Late game Abrams scales hard into a near-unstoppable frontline, but he must keep buying items so he does not fall off as enemies gain more health and damage. Prioritize Seismic Impact and look to land it on grouped enemies in team fights."
      },
      "coreCombo": "Leap in with Seismic Impact to stun a group (aim for the backline), then use Shoulder Charge to push a target into a wall for another stun, while Siphon Life heals you through the fight. Buffer (pre-input) a melee swing during the Shoulder Charge so the hit lands the instant you connect. After the stun, finish with gun fire and a charged heavy melee.",
      "commonMistakes": [
        {
          "mistake": "Fighting in wide-open spaces, where Abrams is weak at long range when his gap closer is down and his wall-stun has no terrain to use.",
          "fix": "Pick narrow lanes and corners for your fights so you can use Shoulder Charge into a wall."
        },
        {
          "mistake": "Diving alone into the enemy backline, which usually gets you killed before your sustain matters.",
          "fix": "Always engage with your team so they can follow up your stuns."
        },
        {
          "mistake": "Ignoring enemy anti-heal, which counters Abrams hard because his whole kit leans on Siphon Life lifesteal and Infernal Resilience regen.",
          "fix": "Watch for enemy anti-healing items and abilities, and play more carefully when they have them."
        },
        {
          "mistake": "Trying to win by poking with abilities from range instead of committing to close combat.",
          "fix": "Use abilities to lock enemies in place, then deal your real damage with gun fire and a charged heavy melee up close."
        },
        {
          "mistake": "Stopping item buys in the late game and falling off as enemies grow stronger.",
          "fix": "Keep buying items into the late game so you stay a strong frontline."
        }
      ],
      "sources": [
        "https://www.dexerto.com/gaming/deadlock-abrams-build-best-items-abilities-more-2882368/",
        "https://hawk.live/posts/deadlock-abrams-hero-guide",
        "https://techwiser.com/deadlock-how-to-play-abrams-best-build-and-strategies/",
        "https://deadlock.wiki/Abrams",
        "https://mobalytics.gg/deadlock/abrams-guide",
        "https://www.thegamer.com/deadlock-abrams-hero-guide/"
      ]
    },
    "zh": {
      "verified": true,
      "winCondition": "Abrams 靠主動開啟近距離戰鬥並全力投入來取勝。他是前排的纏鬥型/坦克英雄：他衝進去、黏住敵人、承受傷害，靠吸血和高血量比對手撐得更久，同時隊友跟進他的暈眩。他真正的傷害來自他的槍，以及暈眩之後的蓄力重擊近戰，而不是遠距離騷擾。用技能把落單的目標定住，然後用射擊收掉他們；不要躲在遠處求安全。",
      "powerCurve": {
        "early": "前期他還算可以，但不算強。先把 Infernal Resilience 升級，受到傷害時可以回復生命，並用這份生存力在對線時贏下近距離對拼，而不是被動地玩。",
        "mid": "中期是他的爆發期。把點數投入 Siphon Life（一個治療光環，依它對敵人造成的精神傷害回復他大量生命）和用來開戰的 Shoulder Charge；在拿到像 Majestic Leap 這類機動/續航道具後，在各路之間遊走，抓落單或站位不佳的敵人。",
        "late": "後期 Abrams 強力成長為幾乎無法阻擋的前排，但他必須持續購買道具，才不會在敵人血量和傷害大幅提升時掉隊。優先點 Seismic Impact，並在團戰中對聚在一起的敵人放出它。"
      },
      "coreCombo": "用 Seismic Impact 跳進去暈眩一群人（瞄準後排），接著用 Shoulder Charge 把一個目標撞進牆裡造成再一次暈眩，同時 Siphon Life 在戰鬥中幫你回血。在 Shoulder Charge 過程中預輸入（buffer）一次近戰揮擊，這樣一接觸到目標傷害就立刻命中。暈眩之後，用槍的射擊和一次蓄力重擊近戰收尾。",
      "commonMistakes": [
        {
          "mistake": "在開闊空間打架，當 Abrams 的位移在冷卻時他遠距離很弱，而且他的撞牆暈眩沒有地形可以利用。",
          "fix": "選擇狹窄的路線和轉角來開戰，這樣你才能用 Shoulder Charge 把敵人撞進牆裡。"
        },
        {
          "mistake": "獨自切進敵方後排，通常會在你的續航發揮作用之前就被打死。",
          "fix": "永遠和隊友一起開戰，讓他們能跟進你的暈眩。"
        },
        {
          "mistake": "忽視敵方的反治療，這會狠狠剋制 Abrams，因為他整套技能都依賴 Siphon Life 吸血和 Infernal Resilience 回復。",
          "fix": "注意敵方的反治療道具和技能，當他們有這些時要打得更謹慎。"
        },
        {
          "mistake": "想靠遠距離用技能騷擾來取勝，而不是投入近距離戰鬥。",
          "fix": "用技能把敵人定在原地，然後在近距離用槍的射擊和蓄力重擊近戰打出你真正的傷害。"
        },
        {
          "mistake": "後期停止購買道具，在敵人變強時掉隊。",
          "fix": "後期持續購買道具，讓你維持強力的前排。"
        }
      ],
      "sources": [
        "https://www.dexerto.com/gaming/deadlock-abrams-build-best-items-abilities-more-2882368/",
        "https://hawk.live/posts/deadlock-abrams-hero-guide",
        "https://techwiser.com/deadlock-how-to-play-abrams-best-build-and-strategies/",
        "https://deadlock.wiki/Abrams",
        "https://mobalytics.gg/deadlock/abrams-guide",
        "https://www.thegamer.com/deadlock-abrams-hero-guide/"
      ]
    }
  },
  "1": {
    "en": {
      "verified": true,
      "winCondition": "Infernus wins by getting close-to-medium range and setting enemies on fire with his abilities and his gun, then staying in the fight while the burn drains their health. His goal is to keep the burn on as many enemies as possible and out-sustain them, not to one-shot anyone. He is squishy and has no way to escape upward, so good positioning is what wins or loses the fight; he must stay even or ahead in souls and items or he becomes too fragile to engage.",
      "powerCurve": {
        "early": "Infernus is fragile early and has no vertical escape, so do not over-commit. Farm safely, land your abilities to poke, and keep your souls even with the enemy so you do not fall behind.",
        "mid": "Infernus spikes around 3000 souls when all abilities are leveled and early items are in, and he becomes a frontline damage dealer with enough health and lifesteal to fight inside the team. A second spike comes when Flame Dash becomes a charge ability with Extra Charge or Rapid Recharge, letting you dash several times per fight; now start playing for kills and ganks instead of just farming.",
        "late": "In the late game Infernus has strong AoE and clears waves and neutral camps very fast, so use this to push lanes and pressure objectives. He stays squishy with no vertical mobility, so fight from cover and good angles, never in the open."
      },
      "coreCombo": "Cast Napalm first: it slows the target 35% for 4 seconds and makes it take 16% more damage, so every later bullet and burn tick hits harder. In a teamfight, prime Concussive Combustion (your ultimate) before you go in, then use Flame Dash to engage so the explosion stuns enemies right as you arrive (it has a 3.25-second delay and a 1.25-second stun in a 12-meter radius). Then shoot the slowed target to build Afterburn, your main damage; it ticks every 0.5 seconds, and headshots build it faster and last longer (15.4% and 1 second per headshot vs 8.1% and 0.5 second per body shot), so landing weapon shots is what actually kills.",
      "commonMistakes": [
        {
          "mistake": "Using Flame Dash too early to chase a target.",
          "fix": "Flame Dash is your only escape, so save it to disengage or to close the gap for a guaranteed kill."
        },
        {
          "mistake": "Using Concussive Combustion as a panic button.",
          "fix": "Enemies see the burning ring and walk out during the 3.25-second delay, so use it on stunned, slowed, or cornered targets."
        },
        {
          "mistake": "Trying to one-shot enemies in a single fast trade.",
          "fix": "Keep the burn on as many enemies as possible and out-sustain them instead of racing for a quick kill."
        },
        {
          "mistake": "Skipping Napalm and shooting first.",
          "fix": "Land Napalm first so the slow and 16% damage amplify make your Afterburn bullets and Concussive Combustion hit much harder."
        },
        {
          "mistake": "Fighting in the open because you feel strong in the late game.",
          "fix": "You are still squishy with no vertical escape, so fight from cover and angles instead."
        }
      ],
      "sources": [
        "https://mobalytics.gg/deadlock/infernus-guide",
        "https://bo3.gg/games/articles/infernus-guide-deadlock",
        "https://upforge.gg/blog/infernus-guide-deadlock",
        "https://deadlock.wiki/Infernus"
      ]
    },
    "zh": {
      "verified": true,
      "winCondition": "Infernus 的取勝方式是靠近到近距離至中距離，用技能和槍把敵人點燃，然後留在戰鬥中，讓燃燒持續扣掉敵人的血量。他的目標是讓盡量多的敵人保持燃燒，並比對手更能持久，而不是一擊秒殺任何人。他很脆，也沒有向上逃脫的手段，所以好的站位決定一場戰鬥的勝負；他必須在靈魂值和裝備上和對手持平或領先，否則就會太脆而無法開戰。",
      "powerCurve": {
        "early": "Infernus 在前期很脆，也沒有垂直逃脫手段，所以不要過度投入。安全發育，用技能騷擾消耗，並讓自己的靈魂值和敵人持平，避免落後。",
        "mid": "Infernus 大約在 3000 靈魂值時迎來爆發點，此時所有技能都已升級且前期裝備到位，他會成為前排輸出，有足夠的血量和吸血可以在團隊裡面打。第二個爆發點是當 Flame Dash 變成可充能技能，並買了 Extra Charge 或 Rapid Recharge，讓你一場戰鬥可以多次衝刺；這時就要開始打擊殺和抓人，而不只是發育。",
        "late": "後期 Infernus 有很強的範圍傷害，清兵線和野怪都非常快，所以用這點來推線和施壓目標。他仍然很脆且沒有垂直機動性，所以要靠掩體和好的角度打，絕不要在空曠處開戰。"
      },
      "coreCombo": "先施放 Napalm：它造成 35% 減速持續 4 秒，並讓目標多承受 16% 傷害，所以之後的每一發子彈和每一次燃燒跳動都會打得更痛。在團戰中，進場前先預先啟動 Concussive Combustion（你的大招），然後用 Flame Dash 開戰，讓爆炸在你抵達的瞬間眩暈敵人（它有 3.25 秒的延遲，並在 12 公尺範圍內造成 1.25 秒眩暈）。接著對被減速的目標開槍來累積 Afterburn，這是你的主要傷害；它每 0.5 秒跳動一次，爆頭累積得更快、持續更久（爆頭每發 15.4% 和 1 秒，相比身體每發 8.1% 和 0.5 秒），所以打中槍法才是真正能擊殺的關鍵。",
      "commonMistakes": [
        {
          "mistake": "太早用 Flame Dash 去追擊目標。",
          "fix": "Flame Dash 是你唯一的逃脫手段，所以要留著脫離戰鬥，或在能穩拿擊殺時用來拉近距離。"
        },
        {
          "mistake": "把 Concussive Combustion 當成慌張時的保命按鈕。",
          "fix": "在 3.25 秒延遲期間敵人看得到燃燒環並會走出範圍，所以要對被眩暈、被減速或被逼到角落的目標使用。"
        },
        {
          "mistake": "想在單次快速交火中一擊秒殺敵人。",
          "fix": "讓盡量多的敵人保持燃燒並比對手更持久，而不是急著拿快速擊殺。"
        },
        {
          "mistake": "跳過 Napalm 直接先開槍。",
          "fix": "先命中 Napalm，靠減速和 16% 增傷讓你的 Afterburn 子彈和 Concussive Combustion 打得更痛。"
        },
        {
          "mistake": "因為後期覺得自己很強就在空曠處開戰。",
          "fix": "你仍然很脆且沒有垂直逃脫手段，所以要改用掩體和角度來打。"
        }
      ],
      "sources": [
        "https://mobalytics.gg/deadlock/infernus-guide",
        "https://bo3.gg/games/articles/infernus-guide-deadlock",
        "https://upforge.gg/blog/infernus-guide-deadlock",
        "https://deadlock.wiki/Infernus"
      ]
    }
  },
  "2": {
    "en": {
      "verified": true,
      "winCondition": "Seven is a farming carry. Farm souls early so you out-scale the enemy, then use your strong AoE damage to win team fights by hitting many grouped enemies at once. You are strongest against a clumped enemy team near objectives, and weak in a 1v1 against one spread-out target.",
      "powerCurve": {
        "early": "Seven is weak and unreliable early. Do not try to kill the enemy laner. Use Lightning Ball and your big magazine to last-hit souls and poke, and avoid dying.",
        "mid": "Your job is to farm fast and stay safe, not to take big fights. Use Lightning Ball and Power Surge to clear waves and neutral camps quickly so you bank souls for late-game items. You can avoid large fights in this window.",
        "late": "Seven is strong late and controls team fights with Storm Cloud. With Storm Cloud maxed and high Spirit items, one well-timed ultimate on a distracted enemy team can wipe them and win the game."
      },
      "coreCombo": "Apply Static Charge to a target, then turn on Power Surge, then unload your gun. Cast Static Charge before you engage so its delayed stun lands when you commit; it does 35 Spirit damage and stuns for 0.9s in a 5m radius after a 3.5s delay. Power Surge charges your bullets for 10 seconds so they bounce shock damage between nearby enemies (up to 4 bounces within 10m), so it does the most work against grouped enemies. Reload first so you have a full magazine, then shoot the target while it is stunned. If enemies leave you alone and you unload a full clip with Power Surge up, you will likely win the fight.",
      "commonMistakes": [
        {
          "mistake": "Bad positioning: Seven has no mobility in his kit, so he is easy to gank and very vulnerable to crowd control.",
          "fix": "Stay with your team and keep escape routes, because you cannot dash away when caught."
        },
        {
          "mistake": "Channeling Storm Cloud while exposed or out of sight, which wastes it and gets you killed by CC.",
          "fix": "Only channel Storm Cloud with line-of-sight to the enemies and from a safe, covered spot."
        },
        {
          "mistake": "Trying to duel a single, spread-out enemy in a 1v1, where Seven is weak.",
          "fix": "Wait for grouped enemies so your AoE and Power Surge bounces hit many targets at once."
        },
        {
          "mistake": "Forcing big fights in the mid game instead of farming.",
          "fix": "Farm waves and neutral camps with Lightning Ball and Power Surge to bank souls for late-game items."
        },
        {
          "mistake": "Casting Power Surge with a near-empty magazine, so the 10-second buff is wasted.",
          "fix": "Reload to a full magazine before you turn on Power Surge, then unload."
        }
      ],
      "sources": [
        "https://dving.net/guides/deadlock/seven-guide",
        "https://mobalytics.gg/deadlock/seven-guide",
        "https://gamerant.com/deadlock-best-seven-build-guide/",
        "https://www.thegamer.com/deadlock-seven-hero-guide/",
        "https://1v9.gg/blog/deadlock-seven-guide-tips-tricks"
      ]
    },
    "zh": {
      "verified": true,
      "winCondition": "Seven 是一個靠發育的核心英雄。前期多打錢（靈魂），讓自己的數值超越敵人，然後用強力的範圍傷害一次打中很多聚在一起的敵人來贏得團戰。當敵人擠成一團、在目標附近作戰時你最強；面對一個分散的單一目標打 1v1 時你最弱。",
      "powerCurve": {
        "early": "Seven 前期很弱、也不穩定。不要想去擊殺對線的敵人。用 Lightning Ball 和你的大彈匣來補刀拿靈魂並騷擾，並且避免死亡。",
        "mid": "你的任務是快速發育並保持安全，不是去打大型戰鬥。用 Lightning Ball 和 Power Surge 快速清兵線和野怪營地，存下靈魂買後期裝備。這個階段你可以避開大型戰鬥。",
        "late": "Seven 後期很強，能用 Storm Cloud 掌控團戰。當 Storm Cloud 點滿並有高靈魂（Spirit）裝備時，一個時機抓得好的終極技能打在分心的敵隊上就能團滅他們並贏下比賽。"
      },
      "coreCombo": "先對目標施放 Static Charge，再開啟 Power Surge，然後把整個彈匣打出去。在開戰前先施放 Static Charge，讓它延遲觸發的暈眩在你進場時剛好生效；它造成 35 點靈魂傷害，並在 3.5 秒延遲後於 5 公尺範圍內暈眩 0.9 秒。Power Surge 會讓你的子彈充能 10 秒，使子彈在附近敵人之間彈跳電擊傷害（在 10 公尺內最多彈跳 4 次），所以它對成群的敵人效果最好。先換彈讓彈匣裝滿，然後趁目標被暈眩時開火。如果敵人不來打擾你，而你在 Power Surge 開啟期間打完一整個彈匣，你很可能會贏下這場戰鬥。",
      "commonMistakes": [
        {
          "mistake": "走位不好：Seven 的技能組裡沒有任何位移，所以很容易被抓，也很怕控制技能（CC）。",
          "fix": "跟著隊友走並保留逃跑路線，因為你被抓住時無法靠衝刺逃走。"
        },
        {
          "mistake": "在沒有掩護或看不到敵人的情況下引導 Storm Cloud，這會浪費它，還會讓你被控制技能擊殺。",
          "fix": "只在能看到敵人的視線內、並從安全有掩護的位置引導 Storm Cloud。"
        },
        {
          "mistake": "想和一個分散的單一敵人打 1v1，而這正是 Seven 最弱的情況。",
          "fix": "等敵人聚在一起，讓你的範圍傷害和 Power Surge 的彈跳能一次打中很多目標。"
        },
        {
          "mistake": "在中期硬要打大型戰鬥，而不是發育。",
          "fix": "用 Lightning Ball 和 Power Surge 清兵線和野怪，存下靈魂買後期裝備。"
        },
        {
          "mistake": "在彈匣快空時施放 Power Surge，讓這 10 秒的增益被浪費掉。",
          "fix": "在開啟 Power Surge 之前先換彈到滿匣，然後再傾瀉火力。"
        }
      ],
      "sources": [
        "https://dving.net/guides/deadlock/seven-guide",
        "https://mobalytics.gg/deadlock/seven-guide",
        "https://gamerant.com/deadlock-best-seven-build-guide/",
        "https://www.thegamer.com/deadlock-seven-hero-guide/",
        "https://1v9.gg/blog/deadlock-seven-guide-tips-tricks"
      ]
    }
  },
  "7": {
    "en": {
      "verified": true,
      "winCondition": "Wraith is a gun-based DPS carry. Win fights by using Project Mind to teleport to a good angle, turning on Full Auto, and shredding one priority target before they can react. She is also one of the best splitpushers and duelists, so take side lanes, push waves and towers fast, and win 1v1 duels, using her teleport to escape if a fight goes bad.",
      "powerCurve": {
        "early": "Wraith is weak early. She needs items and levels, so she is fragile and easy to kill. Play safe, farm, and hit the enemy with your gun to charge Card Trick, then use Card Trick to poke them out of lane.",
        "mid": "Mid game is her main power spike. Her lane comes online at the 2 AP upgrade on Card Trick (helped by Quicksilver Reload), and she becomes very dangerous once Slowing Bullets and Close Quarters are bought. Rush these spikes instead of expecting to be strong early.",
        "late": "Wraith is strong late game. With damage items like Glass Cannon and lifesteal stacked, her single-target kill speed is one of the best in the game. She stays squishy, so still pick your fights and do not get caught out."
      },
      "coreCombo": "The kill combo is Project Mind to a flank angle, then Full Auto on, then gun down one priority target fast. Card Trick is your lane poke: land gun hits to charge it, then use it to push the enemy out and set up kills. Telekinesis is a peel and isolation tool, not only a kill tool. Use it to throw a dangerous enemy away from your target, to lift an enemy who dived you so you can escape or kill them, or to remove the support or peeler so nobody can save the hero you are trying to kill.",
      "commonMistakes": [
        {
          "mistake": "Using Project Mind to dive in aggressively too early.",
          "fix": "Early on, use Project Mind only to escape and reposition safely, not to engage."
        },
        {
          "mistake": "Leading the engage in team fights while squishy.",
          "fix": "Wait for your tanky frontline to engage first, then jump in to delete the priority target."
        },
        {
          "mistake": "Overextending when your Project Mind teleport is down or not upgraded.",
          "fix": "Track your teleport cooldown and do not push out without it, since you are easy to gank."
        },
        {
          "mistake": "Falling behind on farm and items.",
          "fix": "Her value comes from her own farm and damage, not team utility, so focus on farming to stay relevant."
        },
        {
          "mistake": "Playing aggressive in the early game.",
          "fix": "Focus on safe positioning and farming to build your items before you fight."
        }
      ],
      "sources": [
        "https://mobalytics.gg/deadlock/wraith-guide",
        "https://egamersworld.com/blog/deadlock-wraith-guide-N7UafObnJu",
        "https://www.dodge.gg/en-US/deadlock/news/wraith-build-2026"
      ]
    },
    "zh": {
      "verified": true,
      "winCondition": "Wraith 是一個以槍械為主的輸出核心。打團時用 Project Mind 傳送到好的角度，開啟 Full Auto，在對方反應過來之前集火秒掉一個優先目標。她也是遊戲中最強的分推手與單挑手之一，所以要去吃邊路、快速推線推塔、贏下 1v1 對決，如果打不過就用傳送脫離。",
      "powerCurve": {
        "early": "Wraith 前期很弱。她需要裝備和等級，所以很脆、很容易被殺。要打得安全、專心發育，並用槍打中敵人來累積 Card Trick，再用 Card Trick 騷擾把對方逼出兵線。",
        "mid": "中期是她主要的強勢期。當 Card Trick 升到第 2 個技能點（2 AP，並有 Quicksilver Reload 加成）時兵線開始起來，買到 Slowing Bullets 和 Close Quarters 後她會變得非常危險。要衝這些強勢期，不要指望前期很強。",
        "late": "Wraith 後期很強。疊上 Glass Cannon 等傷害裝和吸血後，她的單體擊殺速度是遊戲中最快的之一。但她仍然很脆，所以還是要慎選戰鬥、不要被抓單。"
      },
      "coreCombo": "擊殺連段是：用 Project Mind 傳送到側翼角度，接著開 Full Auto，然後快速用槍打死一個優先目標。Card Trick 是你的兵線騷擾：用槍打中敵人來累積它，再用它把敵人逼出兵線並製造擊殺機會。Telekinesis 是控場與隔離工具，不只是擊殺工具。你可以用它把危險的敵人甩離你的目標，或把撲向你的敵人抬起來讓你脫身或反殺，也可以用它把對方的輔助或保護者拉走，這樣就沒人能救你想殺的英雄。",
      "commonMistakes": [
        {
          "mistake": "太早用 Project Mind 激進地切入。",
          "fix": "前期只用 Project Mind 來脫離和安全走位，不要用來開團。"
        },
        {
          "mistake": "自己很脆卻在團戰中帶頭開團。",
          "fix": "先等你方坦克前排開團，再切進去秒掉優先目標。"
        },
        {
          "mistake": "在 Project Mind 傳送沒好或沒升級時過度推進。",
          "fix": "注意傳送的冷卻時間，沒有它就不要推出去，因為你很容易被抓。"
        },
        {
          "mistake": "發育和裝備落後。",
          "fix": "她的價值來自自己的發育和傷害，而不是團隊功能，所以要專心發育才能保持影響力。"
        },
        {
          "mistake": "前期打得太激進。",
          "fix": "先安全走位和發育、做出裝備，再去打架。"
        }
      ],
      "sources": [
        "https://mobalytics.gg/deadlock/wraith-guide",
        "https://egamersworld.com/blog/deadlock-wraith-guide-N7UafObnJu",
        "https://www.dodge.gg/en-US/deadlock/news/wraith-build-2026"
      ]
    }
  },
  "8": {
    "en": {
      "verified": true,
      "winCondition": "McGinnis is a siege and support hero. You do not win by getting solo kills. You win by holding a lane or objective with your turrets, walls, and healing, keeping your team alive, and letting your teammates get the kills and make space.",
      "powerCurve": {
        "early": "McGinnis is strong early. Her large gun magazine and Mini Turret let her shove the lane, last-hit troopers, deny enemy souls, and out-trade most laners. But she has no dash or escape, so do not push past your turret line or overextend; hide Mini Turret out of the enemy's direct view and let it and your gun farm.",
        "mid": "Mid game is one of her strongest windows because of Heavy Barrage and dropping cooldowns. As soon as you have Heavy Barrage, look for a fight, ideally with a teammate who has crowd control, and buy cooldown reduction so you can place turrets and walls more often.",
        "late": "McGinnis falls off late because she must stand still to deal max damage, which makes her an easy target as enemies get stronger and faster. Play more defensively near your team, lean on walls and healing, and fight on top of several pre-placed turrets rather than racing for damage."
      },
      "coreCombo": "The key team-fight combo is Spectral Wall plus Heavy Barrage. Aim Spectral Wall so it passes THROUGH the enemy, then deploy it right behind them so their back is to the wall and they cannot escape (it also slows them). While they are trapped, channel Heavy Barrage on top of them, and let your Mini Turret and minigun add damage. For sustain, place Mini Turret to deal steady damage and zone, then stand inside Medicinal Specter to heal your team and gain attack speed. This is much stronger if a teammate also has crowd control.",
      "commonMistakes": [
        {
          "mistake": "Relying on Heavy Barrage for damage without leveling it.",
          "fix": "Either max Heavy Barrage as one of your first skills, or do not depend on it for damage."
        },
        {
          "mistake": "Overextending or pushing alone when McGinnis has no mobility or escape.",
          "fix": "Stay near your team, walk safe routes, and treat Spectral Wall as your only real escape tool when dived."
        },
        {
          "mistake": "Placing Mini Turret in the enemy's direct line of sight in lane.",
          "fix": "Hide the turret out of direct view so enemies cannot shoot it down quickly."
        },
        {
          "mistake": "Hunting solo kills instead of holding objectives.",
          "fix": "Play as the anchor: control space, heal, and let teammates get the kills."
        },
        {
          "mistake": "Trying to win late-game damage races by standing still in the open.",
          "fix": "Pre-place several turrets, fight inside your turret zone, and lean on walls and healing."
        }
      ],
      "sources": [
        "https://mobalytics.gg/deadlock/mcginnis-guide",
        "https://deadlocktracker.gg/builds/mcginnis/266927-a-complete-mcginnis-guide",
        "https://www.thegamer.com/deadlock-mcginnis-hero-build-guide/",
        "https://esports.gg/guides/deadlock/best-mcginnis-deadlock-build-army-of-turrets/"
      ]
    },
    "zh": {
      "verified": true,
      "winCondition": "麥金尼斯（McGinnis）是攻城型與輔助型英雄。你不是靠單獨擊殺取勝。你靠的是用砲塔、牆與治療守住一條路或目標，讓隊友活著，並讓隊友去拿擊殺、創造空間。",
      "powerCurve": {
        "early": "麥金尼斯前期很強。她的大彈匣與 Mini Turret 讓她可以推線、補刀小兵、阻止敵方拿魂量，並在對線中壓制大多數對手。但她沒有衝刺或逃脫技能，所以不要推過你的砲塔線或過度突進；把 Mini Turret 藏在敵人視線之外，讓它和你的槍去打錢。",
        "mid": "中期是她最強的時段之一，因為有了 Heavy Barrage，冷卻時間也下降。一拿到 Heavy Barrage 就找機會開團，最好搭配有控場的隊友；並購買冷卻縮減，讓你能更頻繁地放砲塔和牆。",
        "late": "麥金尼斯後期會變弱，因為她必須站著不動才能打出最大傷害，當敵人變強、變快時，她就是好目標。後期要更保守地待在隊友附近，靠牆與治療，並在事先放好的多座砲塔上作戰，而不是去拚傷害。"
      },
      "coreCombo": "關鍵的團戰連招是 Spectral Wall 加 Heavy Barrage。瞄準 Spectral Wall，讓它先「穿過」敵人，然後在他們正後方放出，使他們背對牆、無法逃跑（牆同時也會減速他們）。趁他們被困住時，把 Heavy Barrage 引導壓在他們身上，並讓 Mini Turret 和迷你機槍補傷害。要持續作戰時，放下 Mini Turret 來造成穩定傷害並控場，然後站進 Medicinal Specter 裡治療隊友並獲得攻速加成。若隊友也有控場，這套連招會強很多。",
      "commonMistakes": [
        {
          "mistake": "依賴 Heavy Barrage 造成傷害卻不點它。",
          "fix": "要嘛把 Heavy Barrage 當作最先點的技能之一點滿，要嘛就不要靠它造成傷害。"
        },
        {
          "mistake": "在沒有機動性與逃脫手段時還過度突進或單獨推進。",
          "fix": "待在隊友附近、走安全路線，被切入時把 Spectral Wall 當作你唯一真正的逃脫工具。"
        },
        {
          "mistake": "對線時把 Mini Turret 放在敵人的直接視線內。",
          "fix": "把砲塔藏在視線外，讓敵人無法快速把它打掉。"
        },
        {
          "mistake": "去找單獨擊殺，而不是守目標。",
          "fix": "扮演定錨角色：控制空間、治療，並讓隊友去拿擊殺。"
        },
        {
          "mistake": "後期想靠站在空地上不動來拚傷害。",
          "fix": "事先放好多座砲塔，在你的砲塔範圍內作戰，並靠牆與治療。"
        }
      ],
      "sources": [
        "https://mobalytics.gg/deadlock/mcginnis-guide",
        "https://deadlocktracker.gg/builds/mcginnis/266927-a-complete-mcginnis-guide",
        "https://www.thegamer.com/deadlock-mcginnis-hero-build-guide/",
        "https://esports.gg/guides/deadlock/best-mcginnis-deadlock-build-army-of-turrets/"
      ]
    }
  },
  "13": {
    "en": {
      "verified": true,
      "winCondition": "Haze is a late-game hyper-carry. You win by farming safely, surviving the early game, and scaling into the late game. Once you are strong, use stealth to pick off one enemy at a time, then use your ultimate Bullet Dance to deal massive gun damage and wipe whole grouped enemy teams.",
      "powerCurve": {
        "early": "Haze is WEAK early. The laning phase is her hardest part. Do not fight in lane. Farm safely, grab soul orbs, and try to reach minute 10 with even or positive souls.",
        "mid": "Haze becomes STRONG in the mid game (around minute 10-12), once Smoke Bomb mobility, items, and her ability rotation are online. Leave lane to hunt lone enemies: Smoke Bomb in unseen, Sleep Dagger the target, then gun them down at close range.",
        "late": "Late game is her peak. With Bullet Dance and the right items, Haze can be the single highest-DPS hero in the game. Her goal is to maximize her gun damage in team fights against grouped enemies."
      },
      "coreCombo": "The core pickoff combo is: Smoke Bomb to approach the target while invisible, then Sleep Dagger to lock the target down, then shoot them at close range. Smoke Bomb makes you invisible and faster for 8 seconds; throwing Sleep Dagger does NOT break the invisibility, but attacking does, so dagger first and stay hidden. Let the sleep tick for a moment before you start shooting, because damaging a sleeping target wakes them up early. As you shoot, Fixation stacks build bonus weapon damage on that same target (extra stacks on headshots), so stay on one target up close. Save Bullet Dance for the team fight or to finish the target after Sleep Dagger.",
      "commonMistakes": [
        {
          "mistake": "Pressing Bullet Dance too early, before enemy crowd control is used.",
          "fix": "Bullet Dance is a channel that a stun will interrupt, so wait for your team to engage and key enemy stuns to be spent, or buy Unstoppable, before you ult."
        },
        {
          "mistake": "Fighting aggressively in the lane phase instead of farming.",
          "fix": "Haze is very squishy early, so play safe and prioritize farming over early fights."
        },
        {
          "mistake": "Neglecting soul orb pickups from fallen Troopers.",
          "fix": "Pick up every soul orb so your farm lead arrives in time for the late game."
        },
        {
          "mistake": "Shooting the target the instant you throw Sleep Dagger.",
          "fix": "Let the sleep tick first, because any damage wakes a sleeping target up early."
        },
        {
          "mistake": "Attacking out of Smoke Bomb too soon and dropping invisibility before you are in position.",
          "fix": "Throwing Sleep Dagger and using items keeps you invisible, but attacking breaks it, so set up the dagger first."
        }
      ],
      "sources": [
        "https://www.dodge.gg/news/haze-build-2026",
        "https://deadlock.wiki/Haze",
        "https://ultimatemove.eu/en/deadlock-haze-guide-2026-how-to-actually-play-her/",
        "https://1v9.gg/blog/deadlock-haze-hero-build-strategy-guide"
      ]
    },
    "zh": {
      "verified": true,
      "winCondition": "Haze 是後期的超級核心英雄。你的勝利方式是安全地刷錢、撐過前期，並成長進入後期。當你變強之後，利用隱身一次解決一名敵人，接著用大招 Bullet Dance 造成大量槍械傷害，並一次清掉聚在一起的整支敵隊。",
      "powerCurve": {
        "early": "Haze 前期很弱。對線期是她最難熬的階段。不要在線上開戰。安全地刷錢、撿魂之球，並設法在第 10 分鐘時讓魂值持平或領先。",
        "mid": "Haze 在中期（大約第 10 到 12 分鐘）會變強，這時 Smoke Bomb 的機動性、裝備與技能循環都到位了。離開對線去獵殺落單的敵人：用 Smoke Bomb 在敵人看不見時切入，用 Sleep Dagger 鎖住目標，再近距離把他打死。",
        "late": "後期是她的巔峰。有了 Bullet Dance 與合適的裝備，Haze 可以成為全場 DPS 最高的英雄。她的目標是在團戰中對聚在一起的敵人造成最大化的槍械傷害。"
      },
      "coreCombo": "核心的單殺連招是：先用 Smoke Bomb 在隱身狀態下接近目標，再用 Sleep Dagger 鎖住目標，然後近距離開槍射擊。Smoke Bomb 會讓你隱身並加速 8 秒；丟出 Sleep Dagger 不會解除隱身，但攻擊會，所以先丟飛刀並保持隱身。開槍前先讓睡眠效果持續一下，因為對睡眠中的目標造成傷害會讓他提早醒來。當你射擊時，Fixation 會在同一個目標身上疊加額外的槍械傷害（爆頭會疊更多層），所以要近距離專注打同一個目標。把 Bullet Dance 留到團戰，或在 Sleep Dagger 之後用來收掉目標。",
      "commonMistakes": [
        {
          "mistake": "太早按下 Bullet Dance，在敵人的控場技能還沒用掉之前就開大。",
          "fix": "Bullet Dance 是引導技能，會被擊暈打斷，所以要等隊友先開戰、敵方關鍵的擊暈技能用掉後再開大，或先買 Unstoppable。"
        },
        {
          "mistake": "在對線期不刷錢，反而打得很激進。",
          "fix": "Haze 前期非常脆，所以要打得保守，把刷錢放在比前期開戰更優先的位置。"
        },
        {
          "mistake": "忽略撿拾倒下的小兵（Troopers）掉落的魂之球。",
          "fix": "撿起每一顆魂之球，讓你的經濟領先能及時在後期到位。"
        },
        {
          "mistake": "一丟出 Sleep Dagger 就立刻射擊目標。",
          "fix": "先讓睡眠效果持續一下，因為任何傷害都會讓睡眠中的目標提早醒來。"
        },
        {
          "mistake": "太早攻擊而脫離 Smoke Bomb，在還沒就位前就解除了隱身。",
          "fix": "丟出 Sleep Dagger 與使用道具都會維持隱身，但攻擊會解除隱身，所以要先布置好飛刀。"
        }
      ],
      "sources": [
        "https://www.dodge.gg/news/haze-build-2026",
        "https://deadlock.wiki/Haze",
        "https://ultimatemove.eu/en/deadlock-haze-guide-2026-how-to-actually-play-her/",
        "https://1v9.gg/blog/deadlock-haze-hero-build-strategy-guide"
      ]
    }
  }
}
