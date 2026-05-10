import { useLocation, useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useDict } from './lib/DictContext'
import { useTheme } from './lib/useTheme'
import { LangBadge, EntryCard, SunIcon, MoonIcon, LANG_LABEL } from './components/shared'
import type { SearchResult } from './lib/dictionaries'
import './App.css'

export default function EntryPage() {
  const { word } = useParams<{ word: string }>()
  const location = useLocation()
  const { search, loading } = useDict()
  const [theme, setTheme] = useTheme()

  const passedResult = (location.state as { result?: SearchResult } | null)?.result
  const [result, setResult] = useState<SearchResult | null>(passedResult ?? null)
  const [similar, setSimilar] = useState<SearchResult[]>([])
  const [loadingEntry, setLoadingEntry] = useState(!passedResult)

  useEffect(() => {
    if (passedResult || loading || !word) return
    const decoded = decodeURIComponent(word)
    setLoadingEntry(true)
    search(decoded, 'all').then((results) => {
      const found =
        results.find((r) => r.traditional === decoded || r.simplified === decoded || r.ja?.kanji === decoded || r.ko?.hangul === decoded) ??
        results[0] ??
        null
      setResult(found)
      setLoadingEntry(false)
    })
  }, [word, loading, passedResult, search])

  useEffect(() => {
    if (!result || loading) return
    const char = result.traditional

    const primaryDef =
      result.zh?.definitions[0] ?? result.yue?.definitions[0] ?? result.ja?.definitions[0] ?? result.ko?.definitions[0] ?? ''
    const firstWord = primaryDef.toLowerCase().split(/[\s,;(]/)[0] ?? ''

    const queries: Promise<SearchResult[]>[] = [search(char, 'all')]
    if (firstWord.length > 2 && /^[a-z]/.test(firstWord)) {
      queries.push(search(firstWord, 'all'))
    }

    Promise.all(queries).then((groups) => {
      const seen = new Set<string>([char])
      const combined: SearchResult[] = []
      for (const group of groups) {
        for (const r of group) {
          if (!seen.has(r.traditional)) {
            seen.add(r.traditional)
            combined.push(r)
          }
        }
      }
      setSimilar(combined.slice(0, 8))
    })
  }, [result, loading, search])

  const showAlt = result && result.simplified !== result.traditional

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
        {loading || loadingEntry ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <p className="empty-hint">Loading…</p>
          </div>
        ) : !result ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <p className="empty-hint">Entry not found</p>
            <p className="empty-sub">
              <Link to="/" style={{ color: 'var(--accent)' }}>Back to search</Link>
            </p>
          </div>
        ) : (
          <>
            <section className="entry-detail-hero">
              <div className="entry-detail-char-wrap">
                <span className="entry-detail-char">{result.simplified}</span>
                {showAlt && <span className="entry-detail-char-alt">{result.traditional}</span>}
              </div>
              <div className="entry-detail-badges">
                {result.ja && <LangBadge lang="ja" />}
                {result.ko && <LangBadge lang="ko" />}
                {result.zh && <LangBadge lang="zh" />}
                {result.yue && <LangBadge lang="yue" />}
              </div>
            </section>

            <section className="entry-detail-langs">
              {result.ja && (
                <div className="detail-entry de-ja">
                  <div className="de-header">
                    <LangBadge lang="ja" />
                    <span className="de-lang-name">{LANG_LABEL.ja}</span>
                  </div>
                  {result.ja.reading !== result.ja.kanji && (
                    <div className="de-reading">{result.ja.reading}</div>
                  )}
                  <div className="de-meanings">
                    {result.ja.definitions.slice(0, 12).map((d, i) => (
                      <span key={i} className="de-meaning-pill">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.zh && (
                <div className="detail-entry de-zh">
                  <div className="de-header">
                    <LangBadge lang="zh" />
                    <span className="de-lang-name">{LANG_LABEL.zh}</span>
                  </div>
                  <div className="de-reading">{result.zh.pinyin}</div>
                  <div className="de-meanings">
                    {result.zh.definitions.slice(0, 12).map((d, i) => (
                      <span key={i} className="de-meaning-pill">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.yue && (
                <div className="detail-entry de-yue">
                  <div className="de-header">
                    <LangBadge lang="yue" />
                    <span className="de-lang-name">{LANG_LABEL.yue}</span>
                  </div>
                  <div className="de-reading">{result.yue.jyutping}</div>
                  {result.yue.pinyin !== result.zh?.pinyin && (
                    <div className="de-romanization">{result.yue.pinyin}</div>
                  )}
                  <div className="de-meanings">
                    {result.yue.definitions.slice(0, 12).map((d, i) => (
                      <span key={i} className="de-meaning-pill">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.ko && (
                <div className="detail-entry de-ko">
                  <div className="de-header">
                    <LangBadge lang="ko" />
                    <span className="de-lang-name">{LANG_LABEL.ko}</span>
                  </div>
                  <div className="de-reading">{result.ko.hangul}</div>
                  {result.ko.hanja && result.ko.hanja !== result.simplified && result.ko.hanja !== result.traditional && (
                    <div className="de-romanization">{result.ko.hanja}</div>
                  )}
                  <div className="de-meanings">
                    {result.ko.definitions.slice(0, 12).map((d, i) => (
                      <span key={i} className="de-meaning-pill">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {similar.length > 0 && (
              <section className="entry-similar-section">
                <h2 className="entry-similar-title">Similar</h2>
                <div className="results-list">
                  {similar.map((r) => (
                    <EntryCard key={r.traditional} result={r} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  )
}
