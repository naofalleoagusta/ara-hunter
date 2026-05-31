"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useStockDetail } from "@/lib/queries"
import type { StockDetailResponse } from "@/lib/api"
import ScoreBadge from "@/components/ScoreBadge"
import MLConfidenceBadge from "@/components/MLConfidenceBadge"
import StockRatingReasoning from "@/components/StockRatingReasoning"
import MetricCard from "@/components/MetricCard"
import Skeleton from "@/components/Skeleton"

const RadarScoreCard = dynamic(() => import("@/components/RadarScoreCard"), {
  ssr: false,
  loading: () => <Skeleton variant="card" className="h-80" />,
})

const PriceChartSection = dynamic(() => import("@/components/PriceChartSection"), {
  ssr: false,
  loading: () => <Skeleton variant="chart" className="h-96" />,
})

const ScoreTrendChart = dynamic(() => import("@/components/ScoreTrendChart"), {
  ssr: false,
  loading: () => <div className="h-20 bg-border/60 rounded-lg animate-pulse" />,
})

function formatMarketCap(cap: number | null): string {
  if (!cap) return "-"
  if (cap >= 1e12) return `Rp${(cap / 1e12).toFixed(2)}T`
  if (cap >= 1e9) return `Rp${(cap / 1e9).toFixed(2)}B`
  if (cap >= 1e6) return `Rp${(cap / 1e6).toFixed(0)}M`
  return `Rp${cap.toLocaleString("id-ID")}`
}

interface StockDetailClientProps {
  ticker: string
  initialData: StockDetailResponse | null
}

export default function StockDetailClient({ ticker, initialData }: StockDetailClientProps) {
  const [timeframe, setTimeframe] = useState("1mo")

  const { data, isLoading, isFetching, error } = useStockDetail({
    variables: { ticker, period: timeframe },
    initialData: timeframe === "1mo" ? initialData ?? undefined : undefined,
  })

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="text" className="h-10 w-48" />
          <Skeleton variant="text" className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton variant="card" className="h-80" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" className="h-28" />)}
          </div>
        </div>
        <Skeleton variant="chart" className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border border-red/30 rounded-xl p-6 text-center">
        <p className="text-red font-medium">{error.message}</p>
        <Link href="/" className="inline-block mt-4 text-sm font-medium text-accent hover:text-accent-glow transition duration-200">
          &larr; Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!data) return null

  const d = data.detail
  const ext = data.extended
  const companyName = data.company_name || d?.company_name || ""
  const currentPrice = d?.price ?? ext?.day_low
  const weekLow = ext?.fifty_two_week_low
  const weekHigh = ext?.fifty_two_week_high
  const weekRangePct = weekLow != null && weekHigh != null && weekHigh > weekLow && currentPrice != null
    ? ((currentPrice - weekLow) / (weekHigh - weekLow)) * 100
    : null

  const araTarget = data.ara_target
  const chartData = data.chart?.map(p => ({
    ...p,
    araTarget: araTarget ?? undefined,
  })) ?? null

  const scoreHistory = data.history
    .filter((h): h is typeof h & { total_score: number } => h.total_score != null)
    .map(h => ({ date: `#${h.id}`, score: h.total_score }))
    .reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold font-serif text-text">{ticker}</h1>
            {d ? (
              <div className="flex items-center gap-2">
                <MLConfidenceBadge prob={d.ml_prob} size="lg" />
                <ScoreBadge score={d.total_score} size="lg" showSignal />
              </div>
            ) : (
              <span className="px-3 py-1 text-xs font-semibold text-text-muted bg-border rounded-lg">No scan data</span>
            )}
          </div>
          {currentPrice != null && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-bold text-text">
                Rp{currentPrice.toLocaleString("id-ID", { minimumFractionDigits: 0 })}
              </span>
              {d?.price_change_1d != null && (
                <span className={`text-lg font-semibold ${d.price_change_1d >= 0 ? "text-green" : "text-red"}`}>
                  {d.price_change_1d >= 0 ? "+" : ""}{d.price_change_1d.toFixed(2)}%
                </span>
              )}
            </div>
          )}
          <p className="text-text-muted">{companyName}</p>
          {ext?.sector && <p className="text-xs text-text-muted mt-0.5">{ext.sector}{ext.industry ? ` / ${ext.industry}` : ""}</p>}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-glow transition duration-200"
        >
          &larr; Back
        </Link>
      </div>

      {chartData && chartData.length > 0 && (
        <PriceChartSection
          chartData={chartData}
          araTarget={araTarget}
          ticker={ticker}
          isFetching={isFetching}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      )}

      {weekLow != null && weekHigh != null && weekRangePct != null && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">52-Week Range</span>
            <span className="text-xs text-text-muted">
              Rp{weekLow.toLocaleString("id-ID")} &mdash; Rp{weekHigh.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="relative h-2 bg-border rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min(weekRangePct, 100)}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-accent rounded-full border-2 border-card shadow-sm transition-all duration-500"
              style={{ left: `calc(${Math.min(weekRangePct, 100)}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-1.5">
            <span>Low</span>
            <span className="font-medium text-text">
              Rp{currentPrice?.toLocaleString("id-ID") ?? "-"}
            </span>
            <span>High</span>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Skeleton variant="card" className="h-80" /><div className="grid grid-cols-2 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" className="h-28" />)}</div></div>}>
      {d ? (
        <>
        <StockRatingReasoning
          totalScore={d.total_score}
          momentumScore={d.momentum_score}
          volumeScore={d.volume_score}
          technicalScore={d.technical_score}
          proximityScore={d.proximity_score}
          consistencyScore={d.consistency_score}
          priceChange3d={d.price_change_3d}
          priceChange5d={d.price_change_5d}
          volumeRatio={d.volume_ratio}
          rsi={d.rsi}
          macdBullish={d.macd_bullish}
          araProximityPct={d.ara_proximity_pct}
          consecutiveUpDays={d.consecutive_up_days}
          mlProb={d.ml_prob}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RadarScoreCard
            scores={{
              momentum_score: d.momentum_score,
              volume_score: d.volume_score,
              technical_score: d.technical_score,
              proximity_score: d.proximity_score,
              consistency_score: d.consistency_score,
            }}
          />
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="ML Confidence"
              value={d.ml_prob != null ? `${(d.ml_prob * 100).toFixed(0)}%` : "-"}
              delta={d.ml_prob != null ? (d.ml_prob >= 0.6 ? "High" : d.ml_prob >= 0.5 ? "Medium" : "Low") : null}
              trend={d.ml_prob != null ? (d.ml_prob >= 0.6 ? "up" : d.ml_prob >= 0.5 ? "up" : "down") : null}
            />
            <MetricCard label="Volume Ratio" value={d.volume_ratio ? `${d.volume_ratio.toFixed(1)}x` : "-"} />
            <MetricCard
              label="RSI (14)"
              value={d.rsi?.toFixed(1) ?? "-"}
              delta={d.rsi != null ? (d.rsi > 70 ? "Overbought" : d.rsi < 30 ? "Oversold" : null) : null}
              trend={d.rsi != null ? (d.rsi > 70 ? "down" : d.rsi < 30 ? "up" : null) : null}
            />
            <MetricCard
              label="MACD"
              value={d.macd_bullish != null ? (d.macd_bullish ? "Bullish" : "Bearish") : "-"}
              trend={d.macd_bullish ? "up" : d.macd_bullish != null ? "down" : null}
            />
            <MetricCard
              label="ARA Proximity"
              value={d.ara_proximity_pct != null ? `${d.ara_proximity_pct.toFixed(1)}x` : "-"}
              delta={d.ara_limit_pct != null ? `Limit: ${d.ara_limit_pct}%` : null}
            />
            <MetricCard
              label="Day Range"
              value={ext?.day_low != null && ext?.day_high != null
                ? `Rp${ext.day_low.toLocaleString("id-ID", { minimumFractionDigits: 0 })} - Rp${ext.day_high.toLocaleString("id-ID", { minimumFractionDigits: 0 })}`
                : "-"}
            />
            <MetricCard
              label="Market Cap"
              value={formatMarketCap(ext?.market_cap ?? null)}
            />
          </div>
        </div>
      </>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-text-muted text-sm">This stock has not been scanned yet. Run a scan to see ARA scoring data.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-glow transition duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
      </Suspense>

      {scoreHistory.length > 1 && (
        <ScoreTrendChart data={scoreHistory} />
      )}

      <Suspense fallback={<Skeleton variant="card" className="h-48" />}>
      {data.history && data.history.length > 1 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Screening History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase">Scan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase">Score</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase">Prob</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase">Price</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase">1D</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase hidden md:table-cell">Vol Ratio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase hidden md:table-cell">RSI</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 transition duration-150 hover:bg-card-hover">
                    <td className="px-5 py-3">
                      <Link href={`/results/${r.id}`} className="font-medium text-accent hover:text-accent-glow transition duration-200">
                        #{r.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <ScoreBadge score={r.total_score} size="sm" />
                    </td>
                    <td className="px-5 py-3 font-medium whitespace-nowrap">
                      {r.ml_prob != null ? `${(r.ml_prob * 100).toFixed(0)}%` : "-"}
                    </td>
                    <td className="px-5 py-3 text-text font-medium whitespace-nowrap">
                      {r.price ? `Rp${r.price.toLocaleString("id-ID", { minimumFractionDigits: 0 })}` : "-"}
                    </td>
                    <td className={`px-5 py-3 font-medium whitespace-nowrap ${r.price_change_1d != null && r.price_change_1d >= 0 ? "text-green" : "text-red"}`}>
                      {r.price_change_1d != null ? `${r.price_change_1d >= 0 ? "+" : ""}${r.price_change_1d.toFixed(2)}%` : "-"}
                    </td>
                    <td className="px-5 py-3 text-text-muted whitespace-nowrap hidden md:table-cell">
                      {r.volume_ratio != null ? `${r.volume_ratio.toFixed(1)}x` : "-"}
                    </td>
                    <td className="px-5 py-3 text-text-muted hidden md:table-cell">
                      {r.rsi != null ? r.rsi.toFixed(0) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </Suspense>
    </div>
  )
}
