import { Link } from 'react-router-dom'
import type { SearchResult } from '../lib/dictionaries'

export type Lang = 'zh' | 'yue' | 'ja' | 'ko'

export const LANG_LABEL: Record<Lang, string> = {
  zh: 'Mandarin',
  yue: 'Cantonese',
  ja: 'Japanese',
  ko: 'Korean',
}

export const LANG_SHORT: Record<Lang, string> = {
  zh: 'ZH',
  yue: 'YUE',
  ja: 'JA',
  ko: 'KO',
}

export function LangBadge({ lang }: { lang: Lang }) {
  return <span className={`lang-badge lang-${lang}`}>{LANG_SHORT[lang]}</span>
}

export function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function EntryCard({ result }: { result: SearchResult }) {
  const primaryDef = result.zh?.definitions[0] ?? result.yue?.definitions[0] ?? result.ja?.definitions[0] ?? result.ko?.definitions[0] ?? ''
  const showAlt = result.simplified !== result.traditional

  return (
    <Link to={`/entry/${encodeURIComponent(result.traditional)}`} state={{ result }} className="entry-card">
      <div className="entry-card-top">
        <div className="entry-headword-wrap">
          <span className="entry-headword">{result.simplified}</span>
          {showAlt && <span className="entry-simp">{result.traditional}</span>}
        </div>
        <div className="entry-badges">
          {result.ja && <LangBadge lang="ja" />}
          {result.ko && <LangBadge lang="ko" />}
          {result.zh && <LangBadge lang="zh" />}
          {result.yue && <LangBadge lang="yue" />}
        </div>
      </div>
      <p className="entry-meaning">{primaryDef}</p>
      <div className="entry-readings">
        {result.ja && result.ja.reading !== result.ja.kanji && (
          <span className="entry-reading-pill">
            <span className="dot dot-ja" />
            {result.ja.reading}
          </span>
        )}
        {result.ko && (
          <span className="entry-reading-pill">
            <span className="dot dot-ko" />
            {result.ko.hangul}
          </span>
        )}
        {result.zh && (
          <span className="entry-reading-pill">
            <span className="dot dot-zh" />
            {result.zh.pinyin}
          </span>
        )}
        {result.yue && (
          <span className="entry-reading-pill">
            <span className="dot dot-yue" />
            {result.yue.jyutping}
          </span>
        )}
      </div>
    </Link>
  )
}
