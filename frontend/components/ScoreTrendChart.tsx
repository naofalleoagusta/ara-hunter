"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ScorePoint {
  date: string
  score: number
}

interface ScoreTrendChartProps {
  data: ScorePoint[]
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Score Trend</h3>
      <div className="h-20 w-full">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c84b31" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#c84b31" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e6e0d6",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#8a8580" }}
            />
            <Area type="monotone" dataKey="score" stroke="#c84b31" strokeWidth={2} fill="url(#scoreGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
