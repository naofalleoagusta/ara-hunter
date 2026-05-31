interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  variant?: "card" | "text" | "chart"
}

export default function Skeleton({ width, height, className = "", variant = "text" }: SkeletonProps) {
  const base = "animate-pulse bg-border/60 rounded-lg"

  if (variant === "card") {
    return (
      <div className={`${base} p-5 ${className}`} style={{ width, height }}>
        <div className="h-3 w-1/2 bg-card-hover rounded mb-3" />
        <div className="h-7 w-3/4 bg-card-hover rounded" />
      </div>
    )
  }

  if (variant === "chart") {
    return (
      <div className={`${base} p-5 ${className}`} style={{ width, height }}>
        <div className="h-full w-full bg-card-hover rounded" />
      </div>
    )
  }

  return <div className={`${base} ${className}`} style={{ width, height }} />
}
