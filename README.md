# Brawl Advisor

A reference tool for **Deadlock** Street Brawl (4v4). Pick a hero and see, per hero:

- **Most-picked items by stage** (early / mid / late), ranked by how often players build them, with **win-rate lift** vs the hero's baseline and Wilson-interval significance (green = real edge, red = below average, grey = within noise).
- **Abilities** with all three upgrade tiers (T1/T2/T3) and their effects.
- The **preferred upgrade order** most players use.

Bilingual (English / 简体中文) — names follow the active language.

## Data

All stats come from the community, open-source [deadlock-api.com](https://deadlock-api.com)
(`api.deadlock-api.com`). Not affiliated with Valve. Win rate alone is misleading
(popular and snowball items inflate it), so the item panel leads with pick rate and
treats win rate as a *lift vs baseline* signal.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Build (static, for GitHub Pages)

```bash
npm run generate     # outputs .output/public
```

## Tech

Nuxt 4 (SPA / static) · Vue 3 `<script setup>` · TypeScript. The browser calls
`api.deadlock-api.com` directly (CORS-enabled), so no backend is required.
