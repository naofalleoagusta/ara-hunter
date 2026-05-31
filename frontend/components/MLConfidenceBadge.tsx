import { memo } from "react"

interface MLConfidenceBadgeProps {
  prob: number | null
  size?: "sm" | "md" | "lg"
}

const MLConfidenceBadge = memo(function MLConfidenceBadge({ prob, size = "md" }: MLConfidenceBadgeProps) {
  if (prob == null) return <span className="text-text-muted">-</span>

  const pct = (prob * 100)
  const level = prob >= 0.6 ? "High" : prob >= 0.5 ? "Medium" : "Low"

  const color =
    prob >= 0.6 ? "bg-green/15 text-green border-green/30" :
    prob >= 0.5 ? "bg-amber/15 text-amber border-amber/30" :
    "bg-border text-text-muted border-border"

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-sm px-3 py-1 gap-2",
    lg: "text-base px-4 py-1.5 gap-2",
  }

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${color} ${sizeClasses[size]}`} title={`ML Confidence: ${level}`}>
      <div
        className="rounded-full bg-current opacity-30 shrink-0"
        style={{ width: `${pct}px`, height: size === "sm" ? 4 : size === "lg" ? 7 : 5 }}
      />
      {pct.toFixed(0)}%
      <span className="ml-1 text-[0.65em] font-bold uppercase tracking-wider opacity-70">
        {level}
      </span>
    </span>
  )
})

export default MLConfidenceBadge
