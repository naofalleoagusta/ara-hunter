"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import type { ChartPoint } from "@/lib/api"

interface CandlestickChartProps {
  data: ChartPoint[]
  height?: number
}

interface Candle {
  x: number
  w: number
  openY: number
  closeY: number
  highY: number
  lowY: number
  up: boolean
}

function formatPrice(v: number): string {
  return `Rp${v.toLocaleString("id-ID", { minimumFractionDigits: 0 })}`
}

export default memo(function CandlestickChart({ data, height = 256 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [tooltip, setTooltip] = useState<{ d: ChartPoint; x: number; y: number } | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const padding = { top: 12, right: 16, bottom: 24, left: 72 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const { candles, yLabels, xLabels, step, candleW, toY } = useMemo(() => {
    const lows = data.map((d) => d.low)
    const highs = data.map((d) => d.high)
    const minPrice = Math.min(...lows)
    const maxPrice = Math.max(...highs)
    const priceRange = maxPrice - minPrice || 1

    const toY = (v: number) => padding.top + chartH - ((v - minPrice) / priceRange) * chartH
    const step = chartW / data.length
    const candleW = Math.max(3, step * 0.6)

    const candles: Candle[] = data.map((d, i) => {
      const x = padding.left + i * step
      return {
        x,
        w: candleW,
        openY: toY(d.open),
        closeY: toY(d.close),
        highY: toY(d.high),
        lowY: toY(d.low),
        up: d.close >= d.open,
      }
    })

    const yLabels: number[] = []
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      yLabels.push(minPrice + (priceRange * i) / ySteps)
    }

    const xLabels = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 7)) === 0)

    return { candles, yLabels, xLabels, step, candleW, toY }
  }, [data, chartW, chartH])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const idx = Math.round((mx - padding.left) / step)
    if (idx >= 0 && idx < data.length) {
      const d = data[idx]
      const cx = candles[idx].x + candleW / 2
      setTooltip({ d, x: cx, y: candles[idx].highY - 8 })
      setHoveredIdx(idx)
    }
  }

  const handleMouseLeave = () => {
    setTooltip(null)
    setHoveredIdx(null)
  }

  return (
    <div ref={containerRef} className="w-full relative" style={{ height }}>
      <svg width={width} height={height} className="overflow-visible" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {yLabels.map((v) => (
          <g key={v}>
            <text x={padding.left - 8} y={toY(v) + 4} textAnchor="end" fill="#8a8580" fontSize={11}>
              {formatPrice(v)}
            </text>
            <line x1={padding.left} y1={toY(v)} x2={width - padding.right} y2={toY(v)} stroke="#e6e0d6" strokeWidth={1} />
          </g>
        ))}
        {xLabels.map((d) => {
          const i = data.indexOf(d)
          const x = padding.left + i * step + step / 2
          return (
            <text key={d.date} x={x} y={height - 6} textAnchor="middle" fill="#8a8580" fontSize={10}>
              {d.date.slice(5)}
            </text>
          )
        })}
        {candles.map((c, i) => (
          <g key={i}>
            <line x1={c.x + candleW / 2} y1={c.highY} x2={c.x + candleW / 2} y2={c.lowY} stroke={c.up ? "#2e7d32" : "#c62828"} strokeWidth={1} />
            <rect
              x={c.x}
              y={Math.min(c.openY, c.closeY)}
              width={candleW}
              height={Math.max(Math.abs(c.closeY - c.openY), 1)}
              fill={c.up ? "#2e7d32" : "#c62828"}
              stroke={hoveredIdx === i ? "#1a1a1a" : "none"}
              strokeWidth={hoveredIdx === i ? 1 : 0}
              rx={1}
            />
          </g>
        ))}
      </svg>
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-border rounded-lg px-3 py-2 shadow-lg text-xs z-10"
          style={{
            left: Math.min(tooltip.x, width - 160),
            top: Math.max(tooltip.y - 80, 0),
          }}
        >
          <div className="font-semibold text-text mb-1">{tooltip.d.date}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-text-muted">O:</span><span className="text-text font-medium text-right">{formatPrice(tooltip.d.open)}</span>
            <span className="text-text-muted">H:</span><span className="text-text font-medium text-right">{formatPrice(tooltip.d.high)}</span>
            <span className="text-text-muted">L:</span><span className="text-text font-medium text-right">{formatPrice(tooltip.d.low)}</span>
            <span className="text-text-muted">C:</span><span className="text-text font-medium text-right">{formatPrice(tooltip.d.close)}</span>
            <span className="text-text-muted">Vol:</span><span className="text-text font-medium text-right">{(tooltip.d.volume / 1e6).toFixed(1)}M</span>
          </div>
        </div>
      )}
    </div>
  )
})
