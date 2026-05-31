# Memory Index

## User
- [user] Prefers concise, direct communication — no filler → user-preferences.md
- [user] Likes polished UI with intentional design (cards, progress bars, animations) → user-preferences.md
- [user] Responds well to visual improvements — "use your frontend skills" → user-preferences.md
- [user] Wants plans approved before implementation, then expects execution → user-preferences.md

## Project
- [project] Next.js 15 App Router + React 19, TanStack Query v5, Tailwind v4 → project-conventions.md
- [project] Backend: Python FastAPI + SQLite + yfinance → project-conventions.md
- [project] Warm beige palette (#c84b31 accent, surface/card/border/color tokens) → project-conventions.md
- [project] Signal thresholds: >=70 Strong Buy, >=50 Buy, >=30 Watch, <30 Pass → project-conventions.md
- [project] UI components in `frontend/components/`, API in `lib/api.ts`, queries in `lib/queries.ts` → project-conventions.md
- [project] recharts should be dynamically imported (next/dynamic) for bundle savings → project-conventions.md
- [project] Filter out zero-volume days from yfinance data before computing indicators → project-conventions.md

## Feedback
- [feedback] Likes factor cards with score bars in rating analysis → feedback-history.md
- [feedback] Likes branded chart buttons with platform-specific colors (TV=blue, SB=emerald) → feedback-history.md
- [feedback] Wants Price Chart as 2nd element on stock detail page → feedback-history.md
- [feedback] Wants TV/SB buttons in chart toolbar (compact pill style matching timeframe buttons) → feedback-history.md
- [feedback] Concerned about holiday data ruining scores → feedback-history.md
- [feedback] Dislikes floating buttons without container, generic icons → feedback-history.md
- [feedback] Dislikes recharts bundled eagerly in main chunk (fixed with dynamic imports) → feedback-history.md
