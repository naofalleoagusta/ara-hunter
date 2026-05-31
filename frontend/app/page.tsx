"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { useHistory, useMovers, useScanResults, useStartScan } from "@/lib/queries"
import ScoreBadge from "@/components/ScoreBadge"
import StatusDot from "@/components/StatusDot"
import MetricCard from "@/components/MetricCard"
import Skeleton from "@/components/Skeleton"

function isMarketOpen() {
  const now = new Date()
  const hour = now.getHours()
  return hour >= 9 && hour < 16
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "polling">("idle")
  const [scanError, setScanError] = useState<string | null>(null)

  const { data: history, isLoading: historyLoading } = useHistory({
    variables: { limit: 5 },
  })

  const { data: movers, isLoading: moversLoading } = useMovers()

  const latestId = activeSessionId ?? (history?.[0]?.id ?? null)

  const { data: latestScan, isLoading: scanLoading } = useScanResults({
    variables: { sessionId: latestId!, sort: "total_score", order: "desc", minScore: 0, limit: 10 },
    enabled: latestId != null,
    refetchInterval: scanStatus === "polling" ? 3000 : false,
  })

  const { mutateAsync: triggerScan } = useStartScan({
    onSuccess: (resp) => {
      setActiveSessionId(resp.session_id)
      setScanStatus("polling")
      queryClient.invalidateQueries({ queryKey: ["/api/history"] })
    },
    onError: (err) => {
      setScanError(err.message)
      setScanStatus("idle")
    },
  })

  useEffect(() => {
    if (history?.[0]?.status === "running" && activeSessionId == null) {
      setActiveSessionId(history[0].id)
      setScanStatus("polling")
    }
  }, [history, activeSessionId])

  const handleScan = async () => {
    setScanError(null)
    setScanStatus("scanning")
    try {
      await triggerScan()
    } catch (err) {
      if (err instanceof Error) setScanError(err.message)
      setScanStatus("idle")
    }
  }

  useEffect(() => {
    if (
      latestScan?.session?.id === activeSessionId &&
      latestScan?.session.status !== "running" &&
      scanStatus === "polling"
    ) {
      setScanStatus("idle")
      queryClient.invalidateQueries({ queryKey: ["/api/history"] })
    }
  }, [latestScan?.session?.id, latestScan?.session.status, scanStatus, activeSessionId])

  const scanResultsLoading = scanLoading || (historyLoading && latestId == null)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-serif text-text">
            Ara-Hunter
          </h1>
          <p className="text-text-muted mt-1">IHSG ARA Screener — Real-time stock screening & scoring</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanStatus !== "idle"}
          title={scanStatus !== "idle" ? "A scan is already in progress" : "Run a full scan of all IDX stocks"}
          className={`relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm
            transition-all duration-300
            ${scanStatus !== "idle"
              ? "bg-accent/20 text-accent cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent-glow shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.97]"
            }`}
        >
          {scanStatus !== "idle" ? (
            <>
              <StatusDot status="running" />
              {scanStatus === "scanning" ? "Starting..." : "Scan Running"}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Scan
            </>
          )}
        </button>
      </div>

      {scanError && (
        <div className="bg-card border border-red/30 rounded-xl p-4">
          <p className="text-red text-sm font-medium">{scanError}</p>
        </div>
      )}

      {scanStatus !== "idle" && latestScan?.session && (
        <div className="bg-card border border-accent/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">
                Scanning
                {latestScan.session.total_stocks
                  ? ` ${latestScan.session.stocks_scanned} / ${latestScan.session.total_stocks} stocks`
                  : ` ${latestScan.session.stocks_scanned} stocks`}
              </p>
            </div>
          </div>
          {latestScan.session.total_stocks && (
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min((latestScan.session.stocks_scanned / latestScan.session.total_stocks) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {scanResultsLoading ? (
          <>
            <Skeleton variant="card" className="h-28" />
            <Skeleton variant="card" className="h-28" />
            <Skeleton variant="card" className="h-28" />
            <Skeleton variant="card" className="h-28" />
          </>
        ) : (
          <>
            <MetricCard
              label="Last Score"
              value={latestScan?.session.top_score?.toFixed(1) ?? "-"}
              trend={null}
            />
            <MetricCard
              label="Stocks Scanned"
              value={latestScan?.session.stocks_scanned ?? "-"}
              trend={null}
            />
            <MetricCard
              label="Top Gainer"
              value={movers?.gainers?.[0]?.ticker ?? "-"}
              delta={movers?.gainers?.[0]?.percent != null ? `+${movers?.gainers?.[0]?.percent?.toFixed(2)}%` : null}
              trend={movers?.gainers?.[0] ? "up" : null}
            />
            <MetricCard
              label="Market Status"
              value={isMarketOpen() ? "Open" : "Closed"}
              trend={null}
            />
          </>
        )}
      </div>

      {moversLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} variant="card" className="h-72" />)}
        </div>
      ) : movers ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 transition duration-200 hover:border-green/30">
            <h3 className="text-sm font-semibold text-green uppercase tracking-wider mb-3">Top Gainers</h3>
            <div className="space-y-2">
              {movers.gainers?.slice(0, 5)?.map((s) => (
                <div key={s.ticker} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <Link href={`/stock/${s.ticker}`} className="text-sm font-medium text-accent hover:text-accent-glow transition duration-200">
                    {s.ticker}
                  </Link>
                  <span className="text-sm font-semibold text-green">+{s.percent?.toFixed(2) ?? "0.00"}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 transition duration-200 hover:border-red/30">
            <h3 className="text-sm font-semibold text-red uppercase tracking-wider mb-3">Top Losers</h3>
            <div className="space-y-2">
              {movers.losers?.slice(0, 5)?.map((s) => (
                <div key={s.ticker} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <Link href={`/stock/${s.ticker}`} className="text-sm font-medium text-accent hover:text-accent-glow transition duration-200">
                    {s.ticker}
                  </Link>
                  <span className="text-sm font-semibold text-red">{s.percent?.toFixed(2) ?? "0.00"}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 transition duration-200 hover:border-amber/30">
            <h3 className="text-sm font-semibold text-amber uppercase tracking-wider mb-3">Most Active</h3>
            <div className="space-y-2">
              {movers.most_active?.slice(0, 5)?.map((s) => (
                <div key={s.ticker} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <Link href={`/stock/${s.ticker}`} className="text-sm font-medium text-accent hover:text-accent-glow transition duration-200">
                    {s.ticker}
                  </Link>
                  <span className={`text-sm font-semibold ${s.percent >= 0 ? "text-green" : "text-red"}`}>
                    {s.percent != null ? `${s.percent >= 0 ? "+" : ""}${s.percent.toFixed(2)}%` : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {scanResultsLoading ? (
        <div>
          <h2 className="text-lg font-bold font-serif text-text mb-4">Last Scan Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} variant="card" className="h-28" />)}
          </div>
        </div>
      ) : latestScan ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-serif text-text">
                {scanStatus !== "idle" ? "Current Scan" : "Last Scan Results"}
              </h2>
              {latestScan.results.filter(r => r.total_score != null && r.total_score >= 50).length > 0 && (
                <p className="text-xs text-green mt-1 font-medium">
                  {latestScan.results.filter(r => r.total_score != null && r.total_score >= 50).length} buy signals detected
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/results/${latestScan.session.id}?buy=1`}
                className="text-sm font-medium text-green hover:text-green/80 transition duration-200"
              >
                Buy signals &rarr;
              </Link>
              <Link
                href={`/results/${latestScan.session.id}`}
                className="text-sm font-medium text-accent hover:text-accent-glow transition duration-200"
              >
                View All &rarr;
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {latestScan.results.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                href={`/stock/${r.ticker}`}
                className="bg-card border border-border rounded-xl p-5 transition duration-200 hover:border-accent/40 hover:bg-card-hover group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-lg font-bold text-text group-hover:text-accent transition duration-200">{r.ticker}</span>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{r.company_name || "-"}</p>
                  </div>
                  <ScoreBadge score={r.total_score} />
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-sm font-medium text-text">
                    {r.price ? `Rp${r.price.toLocaleString("id-ID", { minimumFractionDigits: 0 })}` : "-"}
                  </span>
                  {r.price_change_1d != null && (
                    <span className={`text-sm font-semibold ${r.price_change_1d >= 0 ? "text-green" : "text-red"}`}>
                      {r.price_change_1d >= 0 ? "+" : ""}{r.price_change_1d.toFixed(2)}%
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {historyLoading ? (
        <div>
          <h2 className="text-lg font-bold font-serif text-text mb-4">Recent Scans</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 border-b border-border/50">
                <Skeleton variant="text" className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      ) : history && history.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold font-serif text-text mb-4">Recent Scans</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {history.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 last:border-0 transition duration-200 hover:bg-card-hover"
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={s.status} />
                  <span className="text-sm text-text-muted">{new Date(s.created_at).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-text-muted">{s.stocks_scanned} stocks</span>
                  <ScoreBadge score={s.top_score} size="sm" />
                  <Link
                    href={`/results/${s.id}`}
                    className="text-xs font-medium text-accent hover:text-accent-glow transition duration-200"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
