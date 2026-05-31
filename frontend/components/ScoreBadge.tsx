interface ScoreBadgeProps {
  score: number | null
  size?: "sm" | "md" | "lg"
  showSignal?: boolean
}

export default function ScoreBadge({ score, size = "md", showSignal }: ScoreBadgeProps) {
  if (score == null) return <span className="text-text-muted">-</span>

  const signal =
    score >= 70 ? "Strong Buy" :
    score >= 50 ? "Buy" :
    score >= 30 ? "Watch" :
    "Pass"

  const color =
    score >= 70 ? "bg-purple-500/15 text-purple-700 border-purple-500/30" :
    score >= 50 ? "bg-green/15 text-green border-green/30" :
    score >= 30 ? "bg-amber/15 text-amber border-amber/30" :
    "bg-border text-text-muted border-border"

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-sm px-3 py-1 gap-2",
    lg: "text-base px-4 py-1.5 gap-2",
  }

  const barWidth = Math.min(score, 100)

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${color} ${sizeClasses[size]}`} title={signal}>
      <div
        className="rounded-full bg-current opacity-30 shrink-0"
        style={{ width: `${barWidth}px`, height: size === "sm" ? 4 : size === "lg" ? 7 : 5 }}
      />
      {score.toFixed(1)}
      {showSignal && (
        <span className={`ml-1 text-[0.65em] font-bold uppercase tracking-wider opacity-70`}>
          {signal}
        </span>
      )}
    </span>
  )
}
