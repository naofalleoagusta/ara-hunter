import { useQuery, useMutation } from "@tanstack/react-query"
import type { UseMutationOptions } from "@tanstack/react-query"
import * as api from "./api"
import type { ScanSession, ScanResultResponse, StockDetailResponse, MoversResponse, ScanResponse } from "./api"

export function useHistory(args?: {
  variables?: { limit?: number }
  enabled?: boolean
  refetchInterval?: number | false
}) {
  const { variables = { limit: 20 }, ...queryOpts } = args || {}
  return useQuery<ScanSession[], Error>({
    queryKey: ["/api/history", variables],
    queryFn: () => api.getHistory(variables.limit ?? 20),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    ...queryOpts,
  })
}

export function useMovers() {
  return useQuery<MoversResponse, Error>({
    queryKey: ["/api/movers"],
    queryFn: () => api.getMovers(),
    placeholderData: (prev) => prev,
    staleTime: 120 * 1000,
  })
}

export function useScanResults(args?: {
  variables?: { sessionId: number; sort?: string; order?: string; minScore?: number; limit?: number }
  enabled?: boolean
  refetchInterval?: number | false
}) {
  const { variables, ...queryOpts } = args || {}
  return useQuery<ScanResultResponse, Error>({
    queryKey: ["/api/scan", variables ?? {}],
    queryFn: () =>
      api.getScanResults(
        variables!.sessionId,
        variables!.sort ?? "total_score",
        variables!.order ?? "desc",
        variables!.minScore ?? 0,
        variables!.limit ?? 100,
      ),
    placeholderData: (prev) => prev,
    staleTime: 15 * 1000,
    ...queryOpts,
  })
}

export function useStockDetail(args?: {
  variables?: { ticker: string; period?: string }
  initialData?: StockDetailResponse
}) {
  const { variables = { ticker: "", period: "1mo" }, initialData } = args || {}
  return useQuery<StockDetailResponse, Error>({
    queryKey: ["/api/stocks", variables],
    queryFn: () => api.getStockDetail(variables.ticker, variables.period ?? "1mo"),
    placeholderData: (prev) => prev,
    enabled: variables.ticker.length > 0,
    staleTime: 60 * 1000,
    initialData,
  })
}

export function useStartScan(options?: UseMutationOptions<ScanResponse, Error, void>) {
  return useMutation<ScanResponse, Error, void>({
    mutationFn: () => api.startScan(),
    ...options,
  })
}
