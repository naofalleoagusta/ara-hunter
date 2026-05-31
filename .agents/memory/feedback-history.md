---
type: feedback
created: 2026-05-31
updated: 2026-05-31
---

# Feedback History

## Likes
- Factor cards with score bars in StockRatingReasoning component
- Branded chart buttons with platform colors (TradingView=blue, StockBit=emerald)
- Rating analysis with separate Strengths and Concerns sections
- Polished card containers for grouped UI elements
- Signal-colored left border on rating cards
- Staggered fade-in animations on factor cards
- Compact pill button style in chart toolbar matching existing controls
- Price Chart as 2nd page element (below header, above scores)
- Holiday data filter (zero-volume removal) for cleaner scores and chart

## Dislikes
- Floating external chart buttons without a container — felt like an afterthought
- Generic chart SVG icons that don't distinguish platforms
- recharts bundled eagerly in main JS chunk (fixed: dynamic imports)
- FactorCard defined inside parent component causing unmount/remount (fixed: moved to module scope)
- Missing useMemo on expensive candlestick calculations (fixed)
- Missing staleTime on stock detail query causing unnecessary refetches (fixed)

## Improvement Requests
- "Make it better" → expect visual polish, not just functional changes
- Move standalone card content into contextual toolbars
- Data quality concerns about holiday noise in scores → filter zero-volume days
