# Golden Spatula Simulator

เว็บแอปสำหรับ Simulate ทีม Golden Spatula strategy game — วางแชมป์บนบอร์ด เห็น Synergy แบบ real-time และรับคำแนะนำจาก Rule-based AI Advisor ว่าทีมดีไหม ควรเพิ่มหรือเปลี่ยนอะไร

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (SSR)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + custom CSS variables
- **Language**: TypeScript (Strict Mode)
- **State**: `useState()` only (no Pinia)
- **Testing**: Playwright (Behavior-driven, `data-testid` pattern)
- **AI Advisor**: Rule-based scoring engine (`app/utils/gs-scoring.ts`) — designed to be extensible to Claude API

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

- `pnpm dev` — start dev server at http://localhost:3000
- `npx nuxi typecheck` — run type checking
- `pnpm build` — production build

## Scripts

- `pnpm dev` — start Nuxt dev server
- `pnpm build` — build for production
- `pnpm generate` — static site generation
- `pnpm preview` — preview production build

## Features

- **Champion Picker** — browse ~30+ Golden Spatula champions, filter by name or trait
- **Hex Board** — 4×7 hex grid; click champion to add/remove, max 9 units
- **Synergy Panel** — real-time trait activation with threshold progress
- **AI Advisor** — rule-based comp scoring (Trait Synergy 35%, Carry 25%, Frontline 20%, Cost 10%, Slots 10%) + improvement suggestions in Thai
- **Comp Browser** (`/comps`) — 9 pre-built meta compositions with one-click "Load" to board

## Project Structure

```
app/
  assets/css/battle.css      ← cost/tier CSS variables, hex-grid styles
  components/
    Advisor/                 ← ScoreDisplay, BreakdownPanel, SuggestionList
    Board/                   ← HexGrid, HexCell, UnitToken
    Champion/                ← Card, CostBadge, TraitBadge, Picker, DetailModal
    CompBrowser/             ← CompCard, TraitSummary
    Element/                 ← BaseButton, BaseModal, BaseInput, BaseTag
    Synergy/                 ← Panel, TraitRow, ThresholdPips
  composables/gs/            ← useChampions, useSynergies, useTeamBuilder, useCompAnalyzer, useSuggestedComps
  data/                      ← champions.ts, traits.ts, suggestedComps.ts (game data)
  documents/                 ← component .md documentation
  layouts/default.vue        ← global nav + error banner
  pages/
    index.vue                ← main simulator
    comps.vue                ← comp browser
  types/                     ← champion.ts, trait.ts, team.ts, comp.ts
  utils/gs-scoring.ts        ← pure scoring math (no Vue dependency)
```

See `CLAUDE.md` for full conventions and AI agent rules.

## Documentation

- `CLAUDE.md` — conventions and rules for AI agents and developers
- `app/documents/` — component documentation (one `.md` per component)

## Deployment

Static-compatible — `pnpm generate` outputs to `.output/public`. Deploy to Vercel, Netlify, Cloudflare Pages, or Azure Static Web Apps.
