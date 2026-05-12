import { useLocation, useParams, Link } from "react-router-dom"
import { useState, useEffect, type ReactNode } from "react"
import { useDict } from "./lib/DictContext"
import { useSettings } from "./lib/SettingsContext"
import { numbersToDiacritics } from "./lib/dictionaries"
import { LangBadge, EntryCard, LANG_LABEL, SpeakButton } from "./components/shared"
import { AppHeader } from "./components/AppHeader"
import { StrokeOrder } from "./components/StrokeOrder"
import type { SearchResult, PitchAccentEntry } from "./lib/dictionaries"
import "./App.css"

type SimilarFilter = "all" | "zh" | "yue" | "ja" | "ko"

const SIMILAR_FILTERS: { key: SimilarFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ja", label: "JA" },
  { key: "ko", label: "KO" },
  { key: "zh", label: "ZH" },
  { key: "yue", label: "YUE" },
]

const POS_LABEL: Record<string, string> = {
  n: "noun",
  "n-adv": "adv noun",
  "n-pr": "proper noun",
  "n-pref": "noun pref",
  "n-suf": "noun suf",
  "n-t": "temporal noun",
  "adj-i": "i-adj",
  "adj-ix": "i-adj",
  "adj-na": "na-adj",
  "adj-no": "no-adj",
  "adj-pn": "prenominal",
  "adj-t": "taru-adj",
  "adj-f": "prenominal",
  "adj-kari": "kari-adj",
  "adj-ku": "ku-adj",
  "adj-nari": "nari-adj",
  "adj-shiku": "shiku-adj",
  v1: "ichidan",
  "v1-s": "ichidan",
  vk: "kuru verb",
  vs: "suru verb",
  "vs-i": "suru verb",
  "vs-s": "suru verb",
  "vs-c": "suru verb",
  vz: "zuru verb",
  vn: "nu verb",
  vr: "ru verb",
  "v-unspec": "verb",
  vi: "intransitive",
  vt: "transitive",
  v5aru: "godan",
  v5b: "godan",
  v5g: "godan",
  v5k: "godan",
  "v5k-s": "godan",
  v5m: "godan",
  v5n: "godan",
  v5r: "godan",
  "v5r-i": "godan",
  v5s: "godan",
  v5t: "godan",
  v5u: "godan",
  "v5u-s": "godan",
  v5uru: "godan",
  adv: "adverb",
  "adv-to": "to-adverb",
  aux: "auxiliary",
  "aux-adj": "aux adj",
  "aux-v": "aux verb",
  conj: "conjunction",
  cop: "copula",
  ctr: "counter",
  exp: "expression",
  int: "interjection",
  num: "numeric",
  pn: "pronoun",
  pref: "prefix",
  prt: "particle",
  suf: "suffix",
  unc: "unclassified",
}

// Split hiragana/katakana into moras, keeping compound kana (きゃ, ちょ, etc.) together
function splitMoras(kana: string): string[] {
  const small = new Set("ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ")
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
  const hyphen = pa.accent.indexOf("-")
  if (hyphen === -1) return null
  const wordAcc = pa.accent.slice(0, hyphen)
  const particleAcc = pa.accent.slice(hyphen + 1)

  const moras = splitMoras(kana)
  if (moras.length !== wordAcc.length) return null

  const wordLevels = wordAcc.split("").map((c) => (c === "H" ? 1 : 0))
  const particleLevel = particleAcc[0] === "H" ? 1 : 0

  return (
    <div className="pitch-wrap">
      <div className="pitch-text">
        {moras.map((mora, i) => {
          const isH = wordLevels[i] === 1
          const nextLevel =
            i + 1 < wordLevels.length ? wordLevels[i + 1] : particleLevel
          const hasRight = (isH ? 1 : 0) !== nextLevel
          let cls = "pitch-mora"
          cls += isH ? " pitch-h" : " pitch-l"
          if (hasRight) cls += " pitch-right"
          return (
            <span key={i} className={cls}>
              {mora}
            </span>
          )
        })}
      </div>
      <div className="pitch-meta">
        <span className="pitch-sources-count">×{pa.sourceCount}</span>
        <span className="pitch-sources-list">{pa.sources.join(", ")}</span>
      </div>
    </div>
  )
}

export default function EntryPage() {
  const { word } = useParams<{ word: string }>()
  const location = useLocation()
  const { search, loading } = useDict()
  const { pinyinMode, favLang } = useSettings()
  const py = (raw: string) =>
    pinyinMode === "diacritics" ? numbersToDiacritics(raw) : raw

  const passedResult = (location.state as { result?: SearchResult } | null)
    ?.result
  const [result, setResult] = useState<SearchResult | null>(
    passedResult ?? null,
  )
  const [similar, setSimilar] = useState<SearchResult[]>([])
  const [similarFilter, setSimilarFilter] = useState<SimilarFilter>(() =>
    favLang !== "none" ? favLang : "all"
  )
  const [loadingEntry, setLoadingEntry] = useState(!passedResult)

  // Scroll to top on every mount (key prop in App.tsx ensures remount on navigation)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (passedResult || loading || !word) return
    const decoded = decodeURIComponent(word)
    setLoadingEntry(true)
    search(decoded, "all").then((results) => {
      const found =
        results.find(
          (r) =>
            r.traditional === decoded ||
            r.simplified === decoded ||
            r.ja?.[0]?.kanji === decoded ||
            r.ko?.hangul === decoded,
        ) ??
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
      result.zh?.definitions[0] ??
      result.yue?.definitions[0] ??
      result.ja?.[0]?.definitions[0] ??
      result.ko?.definitions[0] ??
      ""
    const firstWord = primaryDef.toLowerCase().split(/[\s,;(]/)[0] ?? ""

    const queries: Promise<SearchResult[]>[] = [search(char, "all")]
    if (firstWord.length > 2 && /^[a-z]/.test(firstWord)) {
      queries.push(search(firstWord, "all"))
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

  const filteredSimilar = similarFilter === "all"
    ? similar
    : similar.filter((r) =>
        similarFilter === "ja" ? !!(r.ja?.length) : r[similarFilter] !== undefined
      )

  const showAlt = result && result.simplified !== result.traditional

  return (
    <>
      <AppHeader />

      <main className="app-main">
        {loading || loadingEntry ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <p className="empty-hint">Loading…</p>
          </div>
        ) : !result ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <p className="empty-hint">Entry not found</p>
            <p className="empty-sub">
              <Link to="/" style={{ color: "var(--accent)" }}>
                Back to search
              </Link>
            </p>
          </div>
        ) : (
          <>
            <section className="entry-detail-hero">
              <div className="entry-detail-char-wrap">
                <span className="entry-detail-char">{result.simplified}</span>
                {showAlt && (
                  <span className="entry-detail-char-alt">
                    {result.traditional}
                  </span>
                )}
              </div>
              <div className="entry-detail-badges">
                {result.ja && <LangBadge lang="ja" />}
                {result.ko && <LangBadge lang="ko" />}
                {result.zh && <LangBadge lang="zh" />}
                {result.yue && <LangBadge lang="yue" />}
              </div>
            </section>

            <StrokeOrder word={result.simplified} />

            <section className="entry-detail-langs">
              {(() => {
                const DEFAULT_ORDER = ['ja', 'zh', 'yue', 'ko'] as const
                type L = typeof DEFAULT_ORDER[number]
                const orderedLangs: L[] = favLang !== 'none'
                  ? [favLang as L, ...DEFAULT_ORDER.filter(l => l !== favLang)]
                  : [...DEFAULT_ORDER]

                const sections: Partial<Record<L, ReactNode>> = {}

                if (result.ja && result.ja.length > 0) {
                  const readingsWithAccent = new Set(
                    result.ja.filter((e) => e.pitchAccents?.length).map((e) => e.reading),
                  )
                  const jaEntries = result.ja.filter(
                    (e) => e.pitchAccents?.length || !readingsWithAccent.has(e.reading),
                  )
                  const jaSpeak = jaEntries.find(e => e.common) ?? jaEntries[0]
                  sections.ja = (
                    <div className="detail-entry de-ja">
                      <div className="de-header">
                        <LangBadge lang="ja" />
                        <span className="de-lang-name">{LANG_LABEL.ja}</span>
                        {jaSpeak && <SpeakButton text={jaSpeak.reading} lang="ja-JP" />}
                      </div>
                      {jaEntries.map((jaEntry, idx) => {
                        const posPills = [
                          ...new Set(jaEntry.pos.map((p) => POS_LABEL[p]).filter(Boolean)),
                        ]
                        return (
                          <div
                            key={idx}
                            className={`ja-sub-entry${jaEntry.archaic ? " ja-sub-archaic" : ""}${idx > 0 ? " ja-sub-divider" : ""}`}
                          >
                            {jaEntry.reading !== jaEntry.kanji && (
                              <div className="de-reading">{jaEntry.reading}</div>
                            )}
                            {(jaEntry.common || posPills.length > 0) && (
                              <div className="ja-pos-tags">
                                {jaEntry.common && (
                                  <span className="common-pill">common</span>
                                )}
                                {posPills.map((label) => (
                                  <span key={label} className="ja-pos-pill">{label}</span>
                                ))}
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
                        )
                      })}
                    </div>
                  )
                }

                if (result.zh) {
                  sections.zh = (
                    <div className="detail-entry de-zh">
                      <div className="de-header">
                        <LangBadge lang="zh" />
                        <span className="de-lang-name">{LANG_LABEL.zh}</span>
                        <SpeakButton text={result.simplified} lang="zh-CN" />
                      </div>
                      <div className="de-reading">{py(result.zh.pinyin)}</div>
                      <div className="de-meanings">
                        {result.zh.definitions.slice(0, 12).map((d, i) => (
                          <span key={i} className="de-meaning-pill">{d}</span>
                        ))}
                      </div>
                    </div>
                  )
                }

                if (result.yue) {
                  sections.yue = (
                    <div className="detail-entry de-yue">
                      <div className="de-header">
                        <LangBadge lang="yue" />
                        <span className="de-lang-name">{LANG_LABEL.yue}</span>
                        <SpeakButton text={result.traditional} lang="zh-HK" />
                      </div>
                      <div className="de-reading">{result.yue.jyutping}</div>
                      {result.yue.pinyin !== result.zh?.pinyin && (
                        <div className="de-romanization">{py(result.yue.pinyin)}</div>
                      )}
                      <div className="de-meanings">
                        {result.yue.definitions.slice(0, 12).map((d, i) => (
                          <span key={i} className="de-meaning-pill">{d}</span>
                        ))}
                      </div>
                    </div>
                  )
                }

                if (result.ko) {
                  sections.ko = (
                    <div className="detail-entry de-ko">
                      <div className="de-header">
                        <LangBadge lang="ko" />
                        <span className="de-lang-name">{LANG_LABEL.ko}</span>
                        <SpeakButton text={result.ko.hangul} lang="ko-KR" />
                      </div>
                      <div className="de-reading">{result.ko.hangul}</div>
                      {result.ko.hanja &&
                        result.ko.hanja !== result.simplified &&
                        result.ko.hanja !== result.traditional && (
                          <div className="de-romanization">{result.ko.hanja}</div>
                        )}
                      <div className="de-meanings">
                        {result.ko.definitions.slice(0, 12).map((d, i) => (
                          <span key={i} className="de-meaning-pill">{d}</span>
                        ))}
                      </div>
                    </div>
                  )
                }

                return orderedLangs.map(lang => sections[lang] ?? null)
              })()}
            </section>

            {similar.length > 0 && (
              <section className="entry-similar-section">
                <div className="entry-similar-header">
                  <h2 className="entry-similar-title">Related</h2>
                  <div className="entry-similar-tabs" role="tablist">
                    {SIMILAR_FILTERS.map(({ key, label }) => (
                      <button
                        key={key}
                        role="tab"
                        aria-selected={similarFilter === key}
                        className={`similar-tab${similarFilter === key ? " active" : ""}`}
                        onClick={() => setSimilarFilter(key)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="results-list">
                  {filteredSimilar.length > 0 ? (
                    filteredSimilar.map((r) => (
                      <EntryCard key={r.traditional} result={r} />
                    ))
                  ) : (
                    <p className="empty-hint" style={{ paddingTop: 12 }}>
                      No related entries
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  )
}
