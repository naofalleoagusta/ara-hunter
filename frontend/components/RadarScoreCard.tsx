"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts"

interface RadarScoreCardProps {
  scores: {
    momentum_score?: number | null
    volume_score?: number | null
    technical_score?: number | null
    proximity_score?: number | null
    consistency_score?: number | null
  }
}

export default function RadarScoreCard({ scores }: RadarScoreCardProps) {
  const data = [
    { axis: "Momentum", value: scores.momentum_score ?? 0 },
    { axis: "Volume", value: scores.volume_score ?? 0 },
    { axis: "Technical", value: scores.technical_score ?? 0 },
    { axis: "Proximity", value: scores.proximity_score ?? 0 },
    { axis: "Consistency", value: scores.consistency_score ?? 0 },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Score Breakdown</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="#e6e0d6" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#8a8580", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="value" fill="#c84b31" fillOpacity={0.2} stroke="#c84b31" strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
