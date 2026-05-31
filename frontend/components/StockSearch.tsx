"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { searchStocks, type StockSearchResult } from "@/lib/api"

export default function StockSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery("")
    setResults([])
    setHighlightIdx(0)
  }, [])

  const select = useCallback((ticker: string) => {
    close()
    router.push(`/stock/${ticker}`)
  }, [close, router])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        return
      }
      if (!isOpen) return
      if (e.key === "Escape") {
        close()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightIdx((prev) => Math.min(prev + 1, results.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightIdx((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === "Enter" && results.length > 0 && results[highlightIdx]) {
        e.preventDefault()
        select(results[highlightIdx].ticker)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isOpen, results, highlightIdx, close, select])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (listRef.current && highlightIdx >= 0) {
      const item = listRef.current.children[highlightIdx] as HTMLElement | undefined
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIdx])

  function handleInput(val: string) {
    setQuery(val)
    setHighlightIdx(0)
    if (timer.current) clearTimeout(timer.current)
    if (!val.trim()) {
      setResults([])
      return
    }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchStocks(val.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted bg-surface border border-border rounded-lg hover:text-text hover:border-accent transition duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted bg-border rounded">
          ⌘K
        </kbd>
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search ticker or company name..."
                className="flex-1 py-3.5 text-sm bg-transparent text-text placeholder-text-muted focus:outline-none"
              />
              {loading && (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold text-text-muted bg-surface border border-border rounded">
                ESC
              </kbd>
            </div>

            {results.length > 0 && (
              <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
                {results.map((r, i) => (
                  <button
                    key={r.ticker}
                    onClick={() => select(r.ticker)}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition duration-100 ${
                      i === highlightIdx ? "bg-card-hover" : ""
                    }`}
                  >
                    <span className="font-semibold text-accent shrink-0">{r.ticker}</span>
                    <span className="text-text-muted truncate">{r.company_name}</span>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
