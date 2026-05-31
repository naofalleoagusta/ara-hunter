"use client"

import { useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useScanResults } from "@/lib/queries"
import type { StockResult } from "@/lib/api"
import ScoreBadge from "@/components/ScoreBadge"
import Skeleton from "@/components/Skeleton"

type SortKey = "total_score" | "momentum_score" | "volume_score" | "technical_score" | "price_change_1d" | "price_change_3d" | "volume_ratio" | "ara_proximity_pct"

interface SortConfig {
  key: SortKey
  order: "asc" | "desc"
}

function classify(score: number | null): string {
  if (score == null) return "Pass"
  if (score >= 70) return "Strong Buy"
  if (score >= 50) return "Buy"
  if (score >= 30) return "Watch"
  return "Pass"
}

const signalOrder = ["Strong Buy", "Buy", "Watch", "Pass"]

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState<SortConfig>({ key: "total_score", order: "desc" })
  const [minScore, setMinScore] = useState(0)
  const [buyOnly, setBuyOnly] = useState(searchParams.get("buy") === "1")

  const ms = buyOnly ? Math.max(minScore, 50) : minScore
  const sessionId = Number(id)

  const { data, isLoading } = useScanResults({
    variables: { sessionId, sort: sort.key, order: sort.order, minScore: ms, limit: 200 },
  })

  const session = data?.session ?? null
  const results = data?.results ?? []
  const buySignals = data?.buy_signals ?? 0

  const toggleSort = (key: SortKey) => {
    if (sort.key === key) {
      setSort((prev) => ({ key, order: prev.order === "desc" ? "asc" : "desc" }))
    } else {
      setSort({ key, order: "desc" })
    }
  }

  const columns: { key: SortKey | null; label: string; hideOnMobile?: boolean }[] = [
    { key: null, label: "#" },
    { key: null, label: "Ticker" },
    { key: null, label: "Company", hideOnMobile: true },
    { key: null, label: "Signal" },
    { key: null, label: "Price" },
    { key: "price_change_1d", label: "1D" },
    { key: "price_change_3d", label: "3D", hideOnMobile: true },
    { key: "volume_ratio", label: "Vol Ratio", hideOnMobile: true },
    { key: null, label: "RSI", hideOnMobile: true },
    { key: "momentum_score", label: "Mtm", hideOnMobile: true },
    { key: "volume_score", label: "Vol", hideOnMobile: true },
    { key: "technical_score", label: "Tech", hideOnMobile: true },
    { key: "ara_proximity_pct", label: "ARA Δ", hideOnMobile: true },
    { key: "total_score", label: "Score" },
  ]

  const signalBadgeClass = (score: number | null) => {
    if (score == null) return "text-text-muted bg-border"
    if (score >= 70) return "text-purple-700 bg-purple-500/15"
    if (score >= 50) return "text-green bg-green/15"
    if (score >= 30) return "text-amber bg-amber/15"
    return "text-text-muted bg-border"
  }

  if (isLoading && results.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton variant="text" className="h-4 w-72" />
        <Skeleton variant="card" className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-text">Scan #{id}</h1>
          {session && (
            <p className="text-sm text-text-muted mt-1">
              {new Date(session.created_at).toLocaleString("id-ID")} &mdash; {session.stocks_scanned} stocks scored
              {session.top_score != null && <> &mdash; Top score: {session.top_score.toFixed(1)}</>}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-glow transition duration-200"
        >
          &larr; Back
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center gap-4">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Min Score</label>
        <input
          type="range"
          min={0}
          max={100}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-48"
        />
        <span className="text-sm font-bold text-accent">{minScore}</span>
        <button
          onClick={() => setBuyOnly(!buyOnly)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-200 ${
            buyOnly
              ? "bg-green/20 text-green border border-green/30"
              : "bg-card text-text-muted border border-border hover:border-text-muted"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Buy only
        </button>
        <span className="text-xs text-text-muted ml-auto">
          {buySignals} buy signals &middot; {results.length} stocks shown
        </span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.label}
                    onClick={() => col.key && toggleSort(col.key)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap
                      ${col.hideOnMobile ? "hidden lg:table-cell" : ""}
                      ${col.key ? "cursor-pointer hover:text-accent transition duration-200" : ""}
                    `}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.key === sort.key && (
                        <span className="text-accent">{sort.order === "desc" ? "\u2193" : "\u2191"}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r: StockResult, i: number) => {
                const sig = classify(r.total_score)
                const sigOrder = signalOrder.indexOf(sig)
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border/50 transition duration-150 hover:bg-card-hover`}
                  >
                    <td className="px-4 py-3 text-text-muted text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/stock/${r.ticker}`} className="font-semibold text-accent hover:text-accent-glow transition duration-200">
                        {r.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted max-w-40 truncate hidden lg:table-cell">{r.company_name || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${signalBadgeClass(r.total_score)}`}>
                        {sig}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text font-medium whitespace-nowrap">
                      {r.price ? `Rp${r.price.toLocaleString("id-ID", { minimumFractionDigits: 0 })}` : "-"}
                    </td>
                    <td className={`px-4 py-3 font-medium whitespace-nowrap ${r.price_change_1d != null && r.price_change_1d >= 0 ? "text-green" : "text-red"}`}>
                      {r.price_change_1d != null ? `${r.price_change_1d >= 0 ? "+" : ""}${r.price_change_1d.toFixed(2)}%` : "-"}
                    </td>
                    <td className={`px-4 py-3 font-medium whitespace-nowrap hidden lg:table-cell ${r.price_change_3d != null && r.price_change_3d >= 0 ? "text-green" : "text-red"}`}>
                      {r.price_change_3d != null ? `${r.price_change_3d >= 0 ? "+" : ""}${r.price_change_3d.toFixed(2)}%` : "-"}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap hidden lg:table-cell ${r.volume_ratio != null && r.volume_ratio > 1 ? "text-green" : "text-text-muted"}`}>
                      {r.volume_ratio != null ? `${r.volume_ratio.toFixed(1)}x` : "-"}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap hidden lg:table-cell ${r.rsi != null && r.rsi >= 50 && r.rsi <= 75 ? "text-green" : r.rsi != null && r.rsi > 75 ? "text-amber" : "text-text-muted"}`}>
                      {r.rsi != null ? r.rsi.toFixed(0) : "-"}
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{r.momentum_score?.toFixed(0) || "-"}</td>
                    <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{r.volume_score?.toFixed(0) || "-"}</td>
                    <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{r.technical_score?.toFixed(0) || "-"}</td>
                    <td className="px-4 py-3 text-amber font-medium whitespace-nowrap hidden lg:table-cell">
                      {r.ara_proximity_pct != null ? `${r.ara_proximity_pct.toFixed(1)}%` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={r.total_score} size="sm" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {results.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-text-muted text-sm">No stocks match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
