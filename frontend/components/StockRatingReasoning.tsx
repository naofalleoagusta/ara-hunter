"use client"

import { useMemo } from "react"

interface StockRatingReasoningProps {
  totalScore: number | null
  momentumScore: number | null
  volumeScore: number | null
  technicalScore: number | null
  proximityScore: number | null
  consistencyScore: number | null
  priceChange3d: number | null
  priceChange5d: number | null
  volumeRatio: number | null
  rsi: number | null
  macdBullish: number | null
  araProximityPct: number | null
  consecutiveUpDays: number | null
}

interface Factor {
  text: string
  score: number
  dimension: string
}

const DIMENSION_ICONS: Record<string, string> = {
  momentum: "▲",
  volume: "▸",
  technical: "●",
  proximity: "◆",
  consistency: "▴",
}

function classifyScore(score: number | null): { signal: string; color: string; accent: string; glow: string } {
  if (score == null) return { signal: "Pass", color: "text-text-muted", accent: "border-border", glow: "" }
  if (score >= 70) return { signal: "Strong Buy", color: "text-purple-700", accent: "border-purple-500", glow: "shadow-purple-500/10" }
  if (score >= 50) return { signal: "Buy", color: "text-green", accent: "border-green", glow: "shadow-green-500/10" }
  if (score >= 30) return { signal: "Watch", color: "text-amber", accent: "border-amber", glow: "shadow-amber-500/10" }
  return { signal: "Pass", color: "text-text-muted", accent: "border-border", glow: "" }
}

function FactorCard({ factor, index }: { factor: Factor; index: number }) {
  const barColor =
    factor.score >= 70 ? "bg-purple-500" :
    factor.score >= 50 ? "bg-green" :
    factor.score >= 30 ? "bg-amber" :
    "bg-border"

  return (
    <div
      className="bg-surface border border-border rounded-xl p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-sm animate-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">{DIMENSION_ICONS[factor.dimension] || "·"}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{factor.dimension}</span>
        </div>
        <span className="text-sm font-bold font-mono tabular-nums text-text">{factor.score.toFixed(0)}</span>
      </div>
      <div className="relative h-1.5 bg-border rounded-full overflow-hidden mb-2.5">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.min(factor.score, 100)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{factor.text}</p>
    </div>
  )
}

export default function StockRatingReasoning(props: StockRatingReasoningProps) {
  const { totalScore } = props
  if (totalScore == null) return null

  const { signal, color, accent, glow } = classifyScore(totalScore)

  const { strengths, concerns, summaryText } = useMemo(() => {
    const strengths: Factor[] = []
    const concerns: Factor[] = []

    const pushFactor = (dimension: string, score: number | null, highText: string, lowText: string) => {
      if (score == null) return
      if (score >= 70) strengths.push({ text: highText, score, dimension })
      else if (score < 50) concerns.push({ text: lowText, score, dimension })
    }

    pushFactor(
      "momentum", props.momentumScore,
      props.priceChange3d != null && props.priceChange5d != null
        ? `Up ${props.priceChange3d.toFixed(1)}% over 3 days and ${props.priceChange5d.toFixed(1)}% over 5 days. Strong and sustained buying pressure.`
        : "Strong price momentum across recent trading sessions with consistent upward movement.",
      "Limited price appreciation across recent days. Lacks the upward thrust needed for a breakout.",
    )

    pushFactor(
      "volume", props.volumeScore,
      props.volumeRatio != null
        ? `Trading at ${props.volumeRatio.toFixed(1)}× average volume. Elevated participation confirms strong buyer interest.`
        : "Well above-average trading volume confirms strong market participation and buying conviction.",
      props.volumeRatio != null
        ? `Volume at only ${props.volumeRatio.toFixed(1)}× average. Low participation suggests lack of institutional conviction.`
        : "Below-average volume indicates weak market participation and limited buying pressure.",
    )

    pushFactor(
      "technical", props.technicalScore,
      (() => {
        const parts: string[] = []
        if (props.rsi != null && props.rsi >= 50 && props.rsi <= 75) parts.push(`RSI at ${props.rsi.toFixed(0)} — in the bullish sweet spot with room to run`)
        if (props.macdBullish === 1) parts.push("MACD confirms bullish momentum")
        return parts.length > 0 ? parts.join(". ") + "." : "All technical indicators align bullishly."
      })(),
      (() => {
        const parts: string[] = []
        if (props.rsi != null && props.rsi > 75) parts.push(`RSI at ${props.rsi.toFixed(0)} — overbought territory signals possible reversal or consolidation`)
        if (props.rsi != null && props.rsi < 30) parts.push(`RSI at ${props.rsi.toFixed(0)} — deeply oversold`)
        if (props.macdBullish === 0) parts.push("MACD is bearish — downside momentum building")
        return parts.length > 0 ? parts.join("; ") + "." : "Technical indicators are bearish or neutral."
      })(),
    )

    pushFactor(
      "proximity", props.proximityScore,
      props.araProximityPct != null
        ? `ARA target within ${props.araProximityPct.toFixed(1)}× reach. Price action approaching the auto-rejection auction limit — high upside potential.`
        : "Close to ARA target price — favorable setup for hitting the auto-rejection auction limit.",
      props.araProximityPct != null
        ? `ARA proximity at ${props.araProximityPct.toFixed(1)}× — too far from target for near-term catalyst.`
        : "Far from ARA target price. Limited upside catalyst in the near term.",
    )

    pushFactor(
      "consistency", props.consistencyScore,
      props.consecutiveUpDays != null
        ? `${props.consecutiveUpDays} consecutive up days. Steady accumulation pattern suggests institutional buying.`
        : "Strong and consistent upward movement across recent sessions confirms trend strength.",
      "No sustained upward streak detected. Price action lacks directional conviction.",
    )

    const summaryText = (() => {
      const s = strengths.length
      const c = concerns.length
      if (totalScore >= 70) {
        if (s >= 4) return `Strong Buy with high conviction — ${s} of 5 dimensions score above 70, led by ${strengths[0].dimension}. Broad-based strength across the board with powerful technical alignment.`
        if (c > 0) return `Strong Buy — excellent ${strengths[0].dimension} score drives the rating. However, keep an eye on ${concerns[0].dimension} which lags behind the overall thesis.`
        return `Strong Buy — driven by exceptional ${strengths[0].dimension} momentum. The overall technical setup is favorable for continued upside.`
      }
      if (totalScore >= 50) {
        if (s > 0 && c > 0) return `Buy signal with mixed dimensions. ${capitalize(strengths[0].dimension)} and ${strengths.length > 1 ? strengths[1].dimension : "other factors"} look promising, but ${c === 1 ? concerns[0].dimension : `${concerns.length} dimensions`} need to improve for a stronger conviction.`
        if (s > 0) return `Buy signal — ${strengths.map(x => x.dimension).join(" and ")} provide the foundation. The rating would benefit from improvement in other dimensions.`
        return `Buy signal, but scores barely cross the threshold. Look for confirmation across more dimensions before adding to positions.`
      }
      if (totalScore >= 30) {
        if (s > 0 && c > 0) return `Watch — conflicting signals. ${capitalize(strengths.map(x => x.dimension).join(" and "))} show promise, while ${concerns.map(x => x.dimension).join(" and ")} raise caution. Wait for clearer direction.`
        if (c > 0) return `Watch — multiple dimensions need improvement. ${capitalize(concerns.map(x => x.dimension).join(" and "))} are the primary drag on the score.`
        return `Watch — scores are moderate but lack conviction across the board. Hold off until stronger signals emerge.`
      }
      if (c > 0) return `Pass — scores are below actionable thresholds. ${capitalize(concerns.map(x => x.dimension).join(" and "))} are the weakest links. Not yet investable.`
      return `Pass — scores are below actionable thresholds across all dimensions. No investable signal at this time.`
    })()

    return { strengths, concerns, summaryText }
  }, [
    totalScore,
    props.momentumScore,
    props.volumeScore,
    props.technicalScore,
    props.proximityScore,
    props.consistencyScore,
    props.priceChange3d,
    props.priceChange5d,
    props.volumeRatio,
    props.rsi,
    props.macdBullish,
    props.araProximityPct,
    props.consecutiveUpDays,
  ])

  const summaryIcon = totalScore >= 70 ? "⚡" : totalScore >= 50 ? "→" : totalScore >= 30 ? "◐" : "✕"

  if (strengths.length === 0 && concerns.length === 0) return null

  return (
    <div className={`bg-card border-l-[5px] ${accent} border border-border rounded-xl p-5 ${glow} shadow-sm`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Rating Analysis</h3>
        <span className={`text-xs font-bold tracking-widest uppercase ${color}`}>{signal}</span>
      </div>

      {strengths.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-green uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green" />
            Strengths
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {strengths.map((f, i) => (
              <FactorCard key={`s-${i}`} factor={f} index={i} />
            ))}
          </div>
        </div>
      )}

      {concerns.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-red uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red" />
            Concerns
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {concerns.map((f, i) => (
              <FactorCard key={`c-${i}`} factor={f} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface/70 border border-border rounded-xl p-4 flex items-start gap-3">
        <span className="text-base mt-0.5 shrink-0">{summaryIcon}</span>
        <p className="text-sm text-text-muted leading-relaxed">{summaryText}</p>
      </div>
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
