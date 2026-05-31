import type { StockDetailResponse } from "./api"

const API_BASE = process.env.API_BASE_URL || "http://localhost:8000"

export async function fetchStockDetail(ticker: string, period = "1mo"): Promise<StockDetailResponse> {
  const res = await fetch(`${API_BASE}/api/stocks/${ticker}?period=${period}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}
