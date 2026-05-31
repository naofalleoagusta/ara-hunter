"use client"

import Link from "next/link"
import { useHistory } from "@/lib/queries"
import StatusDot from "@/components/StatusDot"
import ScoreBadge from "@/components/ScoreBadge"
import Skeleton from "@/components/Skeleton"

export default function HistoryPage() {
  const { data: sessions, isLoading } = useHistory({ variables: { limit: 50 } })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="text" className="h-8 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} variant="card" className="h-16" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-serif text-text">Scan History</h1>

      {!sessions || sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <p className="text-text-muted mb-4">No scans yet. Run your first scan to start screening.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-glow transition duration-200 shadow-lg shadow-accent/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-5 py-4 border-b border-border/50 last:border-0 transition duration-200 hover:bg-card-hover"
            >
              <div className="flex items-center gap-4">
                <StatusDot status={s.status} />
                <div>
                  <p className="text-sm font-medium text-text">{new Date(s.created_at).toLocaleString("id-ID")}</p>
                  <p className="text-xs text-text-muted mt-0.5">#{s.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-sm text-text-muted hidden sm:block">{s.stocks_scanned} stocks</span>
                <ScoreBadge score={s.top_score} size="sm" />
                <Link
                  href={`/results/${s.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent text-xs font-semibold rounded-lg hover:bg-accent/20 transition duration-200"
                >
                  View Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
