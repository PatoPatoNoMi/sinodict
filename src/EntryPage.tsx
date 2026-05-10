import { useLocation, useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useDict } from './lib/DictContext'
import { useTheme } from './lib/useTheme'
import { LangBadge, EntryCard, SunIcon, MoonIcon, LANG_LABEL } from './components/shared'
import type { SearchResult, PitchAccentEntry } from './lib/dictionaries'
import './App.css'

// Split hiragana/katakana into moras, keeping compound kana (きゃ, ちょ, etc.) together
function splitMoras(kana: string): string[] {
  const small = new Set('ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ')
  const moras: string[] = []
  for (let i = 0; i < kana.length; i++) {
    if (i + 1 < kana.length && small.has(kana[i + 1])) {
      moras.push(kana[i] + kana[i + 1])
      i++
    } else {
      moras.push(kana[i])
    }
  }
  return moras
}

function PitchChart({ kana, pa }: { kana: string; pa: PitchAccentEntry }) {
  const hyphen = pa.accent.indexOf('-')
  if (hyphen === -1) return null
  const wordAcc = pa.accent.slice(0, hyphen)
  const particleAcc = pa.accent.slice(hyphen + 1)

  const moras = splitMoras(kana)
  if (moras.length !== wordAcc.length) return null // safety: malformed entry

  const chars = [...moras, 'が']
  const levels = (wordAcc + particleAcc).split('').map((c) => (c === 'H' ? 1 : 0))
  if (chars.length !== levels.length) return null

  const W = 32
  const highY = 6
  const lowY = 24
  const svgH = 34
  const totalW = chars.length * W

  // Step-function path: step happens at the right edge of the previous mora
  let d = `M ${W / 2} ${levels[0] === 1 ? highY : lowY}`
  for (let i = 1; i < levels.length; i++) {
    const prevY = levels[i - 1] === 1 ? highY : lowY
    const currY = levels[i] === 1 ? highY : lowY
    const currX = i * W + W / 2
    if (prevY === currY) {
      d += ` H ${currX}`
    } else {
      d += ` H ${i * W} V ${currY} H ${currX}`
    }
  }

  const sepX = (chars.length - 1) * W

  return (
    <div className="pitch-wrap">
      <svg width={totalW} height={svgH} className="pitch-svg">
        <line x1={sepX} y1={2} x2={sepX} y2={svgH - 2}
          stroke="currentColor" strokeWidth="1" strokeDasharray="2,3" opacity="0.35" />
        <path d={d} stroke="currentColor" strokeWidth="2" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
        {chars.map((_, i) => (
          <circle key={i} cx={i * W + W / 2} cy={levels[i] === 1 ? highY : lowY}
            r="2.5" fill="currentColor" />
        ))}
      </svg>
      <div className="pitch-kana-row">
        {chars.map((c, i) => (
          <span key={i} className={`pitch-mora-label${i === chars.length - 1 ? ' pitch-mora-particle' : ''}`}
            style={{ width: W }}>
            {c}
          </span>
        ))}
      </div>
      <div className="pitch-meta">
        <span className="pitch-accent-str">{pa.accent}</span>
        {pa.hasNHK && <span className="pitch-tag-nhk">NHK</span>}
        <span className="pitch-sources">{pa.sourceCount} sources</span>
      </div>
    </div>
  )
}

export default function EntryPage() {
  const { word } = useParams<{ word: string }>()
  const location = useLocation()
  const { search, loading } = useDict()
  const [theme, setTheme] = useTheme()

  const passedResult = (location.state as { result?: SearchResult } | null)?.result
  const [result, setResult] = useState<SearchResult | null>(passedResult ?? null)
  const [similar, setSimilar] = useState<SearchResult[]>([])
  const [loadingEntry, setLoadingEntry] = useState(!passedResult)

  // Scroll to top on every mount (key prop in App.tsx ensures remount on navigation)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (passedResult || loading || !word) return
    const decoded = decodeURIComponent(word)
    setLoadingEntry(true)
    search(decoded, 'all').then((results) => {
      const found =
        results.find((r) => r.traditional === decoded || r.simplified === decoded || r.ja?.[0]?.kanji === decoded || r.ko?.hangul === decoded) ??
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
      result.zh?.definitions[0] ?? result.yue?.definitions[0] ?? result.ja?.[0]?.definitions[0] ?? result.ko?.definitions[0] ?? ''
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
              {result.ja && result.ja.length > 0 && (
                <div className="detail-entry de-ja">
                  <div className="de-header">
                    <LangBadge lang="ja" />
                    <span className="de-lang-name">{LANG_LABEL.ja}</span>
                  </div>
                  {result.ja.map((jaEntry, idx) => (
                    <div key={idx} className={`ja-sub-entry${jaEntry.archaic ? ' ja-sub-archaic' : ''}${idx > 0 ? ' ja-sub-divider' : ''}`}>
                      {jaEntry.reading !== jaEntry.kanji && (
                        <div className="de-reading">
                          {jaEntry.reading}
                          {jaEntry.archaic && <span className="ja-archaic-tag">archaic</span>}
                        </div>
                      )}
                      {jaEntry.pitchAccents && jaEntry.pitchAccents.length > 0 && (
                        <div className="pitch-accents">
                          {jaEntry.pitchAccents.map((pa, i) => (
                            <PitchChart key={i} kana={jaEntry.reading} pa={pa} />
                          ))}
                        </div>
                      )}
                      <div className="de-meanings">
                        {jaEntry.definitions.slice(0, 12).map((d, i) => (
                          <span key={i} className="de-meaning-pill">{d}</span>
                        ))}
                      </div>
                    </div>
                  ))}
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
