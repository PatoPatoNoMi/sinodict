import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { SearchResult } from './lib/dictionaries'
import { useDict } from './lib/DictContext'
import { useTheme } from './lib/useTheme'
import { EntryCard, SunIcon, MoonIcon } from './components/shared'
import './App.css'

type LangFilter = 'all' | 'zh' | 'yue' | 'ja' | 'ko'

export default function SearchPage() {
  const { loading, loadError, search } = useDict()
  const [theme, setTheme] = useTheme()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LangFilter>('all')
  const [results, setResults] = useState<SearchResult[]>([])

  let inputRef: HTMLInputElement | null = null

  useEffect(() => {
    if (loading || !query.trim()) { setResults([]); return }
    let stale = false
    const timer = setTimeout(() => {
      search(query.trim(), filter).then((res) => { if (!stale) setResults(res) })
    }, 150)
    return () => { stale = true; clearTimeout(timer) }
  }, [query, filter, loading, search])

  const FILTERS: { key: LangFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ja', label: 'JA' },
    { key: 'ko', label: 'KO' },
    { key: 'zh', label: 'ZH' },
    { key: 'yue', label: 'YUE' },
  ]

  function clearSearch() {
    setQuery('')
    inputRef?.focus()
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-logo">
            <span className="logo-sino">Sino</span>Dict
          </Link>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            type="button"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="search-hero">
          <h1 className="hero-title">
            Search across
            <span className="hero-subtitle">日本語 · 한국어 · 中文 · 廣東話</span>
          </h1>

          <div className={`search-box${loading ? ' loading' : ''}`}>
            <span className="search-icon" aria-hidden="true">
              {loading ? (
                <svg className="spin" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </span>
            <input
              ref={(el) => { inputRef = el }}
              type="search"
              className="search-input"
              placeholder={loading ? 'Loading dictionaries…' : 'Search… 愛 · ài · oi3 · あい · 애 · love'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              autoCorrect="off"
              enterKeyHint="search"
            />
            {query && !loading && (
              <button className="search-clear" onClick={clearSearch} type="button" aria-label="Clear search">
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
                className={`lang-tab${filter === key ? ' active' : ''}`}
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
          ) : query.trim() === '' ? (
            <div className="empty-state">
              <p className="empty-hint">
                {loading ? 'Parsing dictionary data…' : 'Type a character, pinyin, jyutping, or English word'}
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
                {results.length} result{results.length !== 1 ? 's' : ''}
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
