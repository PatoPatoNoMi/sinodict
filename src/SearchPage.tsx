import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import type { SearchResult } from "./lib/dictionaries"
import { useDict } from "./lib/DictContext"
import { EntryCard } from "./components/shared"
import { AppHeader } from "./components/AppHeader"
import "./App.css"

type LangFilter = "all" | "zh" | "yue" | "ja" | "ko"

const FILTERS: { key: LangFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ja", label: "JA" },
  { key: "ko", label: "KO" },
  { key: "zh", label: "ZH" },
  { key: "yue", label: "YUE" },
]

export default function SearchPage() {
  const { loading, loadError, search } = useDict()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")
  const [filter, setFilter] = useState<LangFilter>(() => {
    const f = searchParams.get("filter")
    return f === "zh" || f === "yue" || f === "ja" || f === "ko" ? f : "all"
  })
  const [results, setResults] = useState<SearchResult[]>([])

  let inputRef: HTMLInputElement | null = null

  // Sync query/filter → URL (replace so Back skips intermediate typing states)
  useEffect(() => {
    const params: Record<string, string> = {}
    if (query) params.q = query
    if (filter !== "all") params.filter = filter
    setSearchParams(params, { replace: true })
  }, [query, filter, setSearchParams])

  // Run search
  useEffect(() => {
    if (loading || !query.trim()) {
      setResults([])
      return
    }
    let stale = false
    const timer = setTimeout(() => {
      search(query.trim(), filter).then((res) => {
        if (!stale) setResults(res)
      })
    }, 150)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query, filter, loading, search])

  function clearSearch() {
    setQuery("")
    inputRef?.focus()
  }

  return (
    <>
      <AppHeader />

      <main className="app-main">
        <section className="search-hero">
          <h1 className="hero-title">
            Search across
            <span className="hero-subtitle">
              日本語 · 한국어 · 中文 · 廣東話
            </span>
          </h1>

          <div className={`search-box${loading ? " loading" : ""}`}>
            <span className="search-icon" aria-hidden="true">
              {loading ? (
                <svg
                  className="spin"
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </span>
            <input
              ref={(el) => {
                inputRef = el
              }}
              type="search"
              className="search-input"
              placeholder={
                loading
                  ? "Loading dictionaries…"
                  : "Search… 愛 · ài · oi3 · あい · 애 · love"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              autoCorrect="off"
              enterKeyHint="search"
            />
            {query && !loading && (
              <button
                className="search-clear"
                onClick={clearSearch}
                type="button"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="lang-tabs" role="tablist">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                className={`lang-tab${filter === key ? " active" : ""}`}
                onClick={() => setFilter(key)}
                disabled={loading}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="results-section">
          {loadError ? (
            <div className="empty-state">
              <p className="empty-hint">Failed to load dictionaries</p>
              <p className="empty-sub">{loadError}</p>
            </div>
          ) : query.trim() === "" ? (
            <div className="empty-state">
              <p className="empty-hint">
                {loading
                  ? "Loading dictionary data…"
                  : "Search any word in Japanese/Mandarin/Cantonese/Korean"}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <p className="empty-hint">No results for &ldquo;{query}&rdquo;</p>
              <p className="empty-sub">Try a different spelling or character</p>
            </div>
          ) : (
            <div className="results-list">
              <p className="results-count">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((r) => (
                <EntryCard key={r.traditional} result={r} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
