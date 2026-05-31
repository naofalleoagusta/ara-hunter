interface StatusDotProps {
  status: string
}

export default function StatusDot({ status }: StatusDotProps) {
  const config: Record<string, { color: string; animate: string }> = {
    running: { color: "bg-green", animate: "animate-pulse shadow-lg shadow-green/30" },
    completed: { color: "bg-blue", animate: "" },
    success: { color: "bg-blue", animate: "" },
    failed: { color: "bg-red", animate: "" },
    error: { color: "bg-red", animate: "" },
  }

  const c = config[status] || { color: "bg-text-muted", animate: "" }

  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.color} ${c.animate}`} />
}
