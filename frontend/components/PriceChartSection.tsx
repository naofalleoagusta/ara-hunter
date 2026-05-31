"use client"

import { useState } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import CandlestickChart from "@/components/CandlestickChart"

interface ChartPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  araTarget?: number
}

interface PriceChartSectionProps {
  chartData: (ChartPoint & { araTarget: number | undefined })[]
  araTarget: number | null
  ticker: string
  isFetching: boolean
  timeframe: string
  onTimeframeChange: (t: string) => void
}

const TIMEFRAMES = ["1d", "1w", "1mo", "3mo", "6mo", "1y"] as const

export default function PriceChartSection({ chartData, araTarget, ticker, isFetching, timeframe, onTimeframeChange }: PriceChartSectionProps) {
  const [chartView, setChartView] = useState<"area" | "candle">("area")

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Price Chart
          {araTarget != null && <span className="ml-2 text-accent font-normal normal-case">— ARA target: Rp{araTarget.toLocaleString("id-ID")}</span>}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-border">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                    onClick={() => onTimeframeChange(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition duration-200 ${timeframe === t ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setChartView("area")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-200 ${chartView === "area" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text"}`}
            >
              Area
            </button>
            <button
              onClick={() => setChartView("candle")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition duration-200 ${chartView === "candle" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text"}`}
            >
              Candle
            </button>
          </div>
          <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-border">
            <a
              href={`https://www.tradingview.com/chart/?symbol=IDX%3A${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on TradingView"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-text-muted hover:text-blue-600 transition duration-200"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              TV
            </a>
            <a
              href={`https://stockbit.com/symbol/${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on ChartBit"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-text-muted hover:text-emerald-600 transition duration-200"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="7" width="4" height="14" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
              </svg>
              SB
            </a>
          </div>
        </div>
      </div>
      <div className="relative">
        {isFetching && (
          <div className="absolute inset-0 bg-card/70 z-10 flex items-center justify-center rounded-lg">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      {chartView === "area" ? (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c84b31" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#c84b31" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#8a8580", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={([min, max]: number[]) => [min - (max - min) * 0.05, max + (max - min) * 0.05]} tick={{ fill: "#8a8580", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e6e0d6",
                    borderRadius: 8,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ color: "#8a8580" }}
                />
                <Area type="monotone" dataKey="close" stroke="#c84b31" strokeWidth={2} fill="url(#priceGradient)" dot={false} />
                {araTarget != null && (
                  <Area type="monotone" dataKey="araTarget" stroke="#c84b31" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} isAnimationActive={false} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-24 w-full mt-2">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fill: "#8a8580", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e6e0d6",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#8a8580" }}
                />
                <Bar dataKey="volume" fill="#e6e0d6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <CandlestickChart data={chartData} height={360} />
      )}
      </div>
    </div>
  )
}
