const API_BASE = "http://localhost:8000"

export interface ScanSession {
  id: number
  created_at: string
  status: string
  stocks_scanned: number
  total_stocks: number | null
  top_score: number | null
}

export interface StockResult {
  id: number
  ticker: string
  company_name: string | null
  sector: string | null
  board: string | null
  price: number | null
  price_change_1d: number | null
  price_change_3d: number | null
  price_change_5d: number | null
  volume: number | null
  volume_ratio: number | null
  rsi: number | null
  bb_position: number | null
  macd_bullish: number | null
  consecutive_up_days: number | null
  ara_limit_pct: number | null
  ara_proximity_pct: number | null
  momentum_score: number | null
  volume_score: number | null
  technical_score: number | null
  proximity_score: number | null
  consistency_score: number | null
  total_score: number | null
  ml_prob: number | null
}

export interface ScanResponse {
  session_id: number
  status: string
  message: string
}

export interface ScanResultResponse {
  session: ScanSession
  results: StockResult[]
  total: number
  buy_signals?: number
}

export interface ExtendedInfo {
  fifty_two_week_high: number | null
  fifty_two_week_low: number | null
  market_cap: number | null
  day_high: number | null
  day_low: number | null
  sector: string | null
  industry: string | null
}

export interface ChartPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockDetailResponse {
  detail: StockResult | null
  history: StockResult[]
  chart: ChartPoint[] | null
  extended: ExtendedInfo | null
  ara_target: number | null
  ticker?: string
  company_name?: string
}

export interface StockSearchResult {
  ticker: string
  company_name: string
}

export interface MoversResponse {
  gainers: { ticker: string; price: number; change: number; percent: number; volume: number }[]
  losers: { ticker: string; price: number; change: number; percent: number; volume: number }[]
  most_active: { ticker: string; price: number; change: number; percent: number; volume: number }[]
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.detail?.message || body?.detail || `${res.status} ${res.statusText}`
    const err = new Error(msg)
    ;(err as any).status = res.status
    ;(err as any).body = body
    throw err
  }
  return res.json()
}

export async function startScan(): Promise<ScanResponse> {
  return fetchJson<ScanResponse>(`${API_BASE}/api/scan`, { method: "POST" })
}

export async function getScanResults(
  sessionId: number,
  sort = "total_score",
  order = "desc",
  minScore = 0,
  limit = 100
): Promise<ScanResultResponse> {
  const params = new URLSearchParams({ sort, order, min_score: String(minScore), limit: String(limit) })
  return fetchJson<ScanResultResponse>(`${API_BASE}/api/scan/${sessionId}?${params}`)
}

export async function getHistory(limit = 20): Promise<ScanSession[]> {
  return fetchJson<ScanSession[]>(`${API_BASE}/api/history?limit=${limit}`)
}

export async function getStockDetail(ticker: string, period = "1mo"): Promise<StockDetailResponse> {
  return fetchJson<StockDetailResponse>(`${API_BASE}/api/stocks/${ticker}?period=${period}`)
}

export async function getMovers(): Promise<MoversResponse> {
  return fetchJson<MoversResponse>(`${API_BASE}/api/movers`)
}

export async function searchStocks(q: string): Promise<StockSearchResult[]> {
  return fetchJson<StockSearchResult[]>(`${API_BASE}/api/stocks/search?q=${encodeURIComponent(q)}`)
}
