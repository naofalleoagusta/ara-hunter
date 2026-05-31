import { fetchStockDetail } from "@/lib/api-server"
import StockDetailClient from "@/components/StockDetailClient"

export default async function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params

  let initialData = null
  try {
    initialData = await fetchStockDetail(ticker)
  } catch {
    // Server fetch failed — client will fetch on its own
  }

  return <StockDetailClient ticker={ticker} initialData={initialData} />
}
