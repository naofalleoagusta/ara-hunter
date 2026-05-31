interface MetricCardProps {
  label: string
  value: string | number | null | undefined
  delta?: string | null
  trend?: "up" | "down" | null
}

export default function MetricCard({ label, value, delta, trend }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 transition duration-200 hover:border-accent/30 hover:bg-card-hover">
      <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-2xl font-bold text-text">{value ?? "-"}</div>
      {delta && (
        <div className={`text-sm font-medium mt-1 ${trend === "up" ? "text-green" : trend === "down" ? "text-red" : "text-text-muted"}`}>
          {delta}
        </div>
      )}
    </div>
  )
}
