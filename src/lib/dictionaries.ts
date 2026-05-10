export interface ZhEntry {
  traditional: string
  simplified: string
  pinyin: string
  definitions: string[]
}

export interface YueEntry {
  traditional: string
  simplified: string
  pinyin: string
  jyutping: string
  definitions: string[]
}

export interface PitchAccentEntry {
  accent: string      // e.g. "LHH-H"
  sourceCount: number
  hasNHK: boolean
  sources: string[]
}

export interface JaEntry {
  kanji: string
  reading: string
  definitions: string[]
  pos: string[]
  archaic?: true
  pitchAccents?: PitchAccentEntry[]
}

export interface KoEntry {
  hangul: string
  hanja: string    // pure CJK extracted from raw hanja field; empty if none
  definitions: string[]
}

export interface DictDB {
  zh: ZhEntry[]
  yue: YueEntry[]
  ja: JaEntry[]
  ko: KoEntry[]
}

export interface SearchResult {
  traditional: string
  simplified: string
  zh?: ZhEntry
  yue?: YueEntry
  ja?: JaEntry[]   // multiple readings (e.g. ねこ + archaic ねこま)
  ko?: KoEntry
}

export type LangKey = 'zh' | 'yue' | 'ja' | 'ko'

export type WorkerInMsg = {
  type: 'search'
  id: number
  query: string
  filter: 'all' | LangKey
  favLang?: LangKey
}

export type WorkerOutMsg =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'results'; id: number; results: SearchResult[] }

function kataToHira(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

// Convert CC-CEDICT number-tone pinyin (sen1) to diacritic form (sēn)
export function numbersToDiacritics(pinyin: string): string {
  const tv: Record<string, string[]> = {
    a: ['ā','á','ǎ','à','a'], e: ['ē','é','ě','è','e'],
    i: ['ī','í','ǐ','ì','i'], o: ['ō','ó','ǒ','ò','o'],
    u: ['ū','ú','ǔ','ù','u'], ü: ['ǖ','ǘ','ǚ','ǜ','ü'],
  }
  return pinyin.split(' ').map((syl) => {
    const m = syl.match(/^([A-Za-zÜü:]+)([1-5])$/)
    if (!m) return syl
    const tone = parseInt(m[2]) - 1
    let s = m[1].toLowerCase().replace(/u:/g, 'ü')
    let idx = -1
    if (s.includes('a')) idx = s.indexOf('a')
    else if (s.includes('e')) idx = s.indexOf('e')
    else if (s.includes('ou')) idx = s.indexOf('o')
    else for (let i = s.length - 1; i >= 0; i--) {
      if ('iouü'.includes(s[i])) { idx = i; break }
    }
    if (idx === -1) return s  // no vowel (e.g. standalone r)
    const marked = s.slice(0, idx) + (tv[s[idx]]?.[tone] ?? s[idx]) + s.slice(idx + 1)
    return m[1][0] === m[1][0].toUpperCase() ? marked[0].toUpperCase() + marked.slice(1) : marked
  }).join(' ')
}

// Hepburn romaji → hiragana (greedy, longest-match first)
const R2H: Record<string, string> = {
  shi:'し',chi:'ち',tsu:'つ',sha:'しゃ',shu:'しゅ',sho:'しょ',
  cha:'ちゃ',chu:'ちゅ',cho:'ちょ',tchi:'っち',
  kya:'きゃ',kyu:'きゅ',kyo:'きょ',nya:'にゃ',nyu:'にゅ',nyo:'にょ',
  hya:'ひゃ',hyu:'ひゅ',hyo:'ひょ',mya:'みゃ',myu:'みゅ',myo:'みょ',
  rya:'りゃ',ryu:'りゅ',ryo:'りょ',gya:'ぎゃ',gyu:'ぎゅ',gyo:'ぎょ',
  bya:'びゃ',byu:'びゅ',byo:'びょ',pya:'ぴゃ',pyu:'ぴゅ',pyo:'ぴょ',
  jya:'じゃ',jyu:'じゅ',jyo:'じょ',
  ka:'か',ki:'き',ku:'く',ke:'け',ko:'こ',
  sa:'さ',su:'す',se:'せ',so:'そ',si:'し',
  ta:'た',te:'て',to:'と',ti:'ち',tu:'つ',
  na:'な',ni:'に',nu:'ぬ',ne:'ね',no:'の',
  ha:'は',hi:'ひ',fu:'ふ',hu:'ふ',he:'へ',ho:'ほ',
  ma:'ま',mi:'み',mu:'む',me:'め',mo:'も',
  ya:'や',yu:'ゆ',yo:'よ',
  ra:'ら',ri:'り',ru:'る',re:'れ',ro:'ろ',
  wa:'わ',wo:'を',
  ga:'が',gi:'ぎ',gu:'ぐ',ge:'げ',go:'ご',
  za:'ざ',zi:'じ',zu:'ず',ze:'ぜ',zo:'ぞ',
  da:'だ',de:'で',do:'ど',di:'ぢ',du:'づ',
  ba:'ば',bi:'び',bu:'ぶ',be:'べ',bo:'ぼ',
  pa:'ぱ',pi:'ぴ',pu:'ぷ',pe:'ぺ',po:'ぽ',
  ja:'じゃ',ji:'じ',ju:'じゅ',je:'じぇ',jo:'じょ',
  a:'あ',i:'い',u:'う',e:'え',o:'お',
}

function romajiToHiragana(s: string): string {
  const r = s.toLowerCase()
  let out = ''
  let i = 0
  while (i < r.length) {
    // double consonant → っ (skip vowels and 'n')
    if (r[i] !== 'n' && !'aiueo'.includes(r[i]) && r[i] === r[i + 1]) {
      out += 'っ'
      i++
      continue
    }
    // 'n' before consonant or end of string → ん
    if (r[i] === 'n' && (i + 1 >= r.length || !'aiueoyn'.includes(r[i + 1]))) {
      out += 'ん'
      i++
      continue
    }
    const m4 = R2H[r.slice(i, i + 4)]
    if (m4) { out += m4; i += 4; continue }
    const m3 = R2H[r.slice(i, i + 3)]
    if (m3) { out += m3; i += 3; continue }
    const m2 = R2H[r.slice(i, i + 2)]
    if (m2) { out += m2; i += 2; continue }
    const m1 = R2H[r[i]]
    if (m1) { out += m1; i++; continue }
    out += r[i] // pass through unrecognised chars (spaces, hyphens, etc.)
    i++
  }
  return out
}

// EDICT format: Kanji [reading] /def1/def2/(P)/ or Kana /def1/def2/
const EDICT_POS = new Set([
  'n','n-adv','n-pr','n-pref','n-suf','n-t',
  'adj-f','adj-i','adj-ix','adj-kari','adj-ku','adj-na','adj-nari','adj-no','adj-pn','adj-shiku','adj-t',
  'v1','v1-s','vk','vn','vr','vs','vs-c','vs-i','vs-s','vz','vi','vt','v-unspec',
  'v5aru','v5b','v5g','v5k','v5k-s','v5m','v5n','v5r','v5r-i','v5s','v5t','v5u','v5u-s','v5uru',
  'v2a-s','v2b-k','v2b-s','v2d-k','v2d-s','v2g-k','v2g-s','v2h-k','v2h-s','v2k-k','v2k-s',
  'v2m-k','v2m-s','v2n-s','v2r-k','v2r-s','v2s-s','v2t-k','v2t-s','v2w-s','v2y-k','v2y-s','v2z-s',
  'v4b','v4g','v4h','v4k','v4m','v4n','v4r','v4s','v4t',
  'adv','adv-to','aux','aux-adj','aux-v','conj','cop','ctr','exp','int','num','pn','pref','prt','suf','unc',
])

function extractPos(defsRaw: string): string[] {
  const seen = new Set<string>()
  for (const def of defsRaw.split('/')) {
    const m = def.match(/^(\([^)]+\)\s*)+/)
    if (!m) continue
    for (const [, inner] of m[0].matchAll(/\(([^)]+)\)/g)) {
      for (const tag of inner.split(',')) {
        const t = tag.trim()
        if (EDICT_POS.has(t)) seen.add(t)
      }
    }
  }
  return [...seen]
}

function parseEdictLine(line: string): JaEntry | null {
  if (!line || line.charCodeAt(0) === 0x3000) return null // skip header (full-width space)
  const slashI = line.indexOf('/')
  if (slashI === -1) return null
  const head = line.slice(0, slashI).trimEnd()
  const defsRaw = line.slice(slashI + 1, line.lastIndexOf('/'))
  if (!defsRaw) return null

  let kanji: string
  let reading: string
  const bi = head.indexOf('[')
  if (bi !== -1) {
    const bj = head.indexOf(']', bi)
    if (bj === -1) return null
    kanji = head.slice(0, bi).trimEnd()
    reading = head.slice(bi + 1, bj)
  } else {
    // kana-only entry
    kanji = head.trim()
    reading = head.trim()
  }

  const archaic = defsRaw.includes('(arch)') || undefined
  const pos = extractPos(defsRaw)

  // Strip ALL leading POS/sense-number groups: "(n) (1) cat..." → "cat..."
  const definitions = defsRaw
    .split('/')
    .map((d) => d.replace(/^(\([^)]+\)\s*)+/, '').trim())
    .filter((d) => d.length > 0)

  if (!kanji || definitions.length === 0) return null
  return { kanji, reading, definitions, pos, archaic }
}

export function parseEdict(text: string): JaEntry[] {
  const lines = text.split('\n')
  const result: JaEntry[] = []
  for (const line of lines) {
    const entry = parseEdictLine(line)
    if (entry) result.push(entry)
  }
  return result
}

// kengdic TSV format: id \t hangul \t hanja \t gloss \t ...
function parseKengdicLine(line: string): KoEntry | null {
  const parts = line.split('\t')
  if (parts.length < 3) return null
  const hangul = parts[1]?.trim()
  if (!hangul) return null
  const rawHanja = parts[2] ?? ''
  const gloss = parts[3]?.trim() ?? ''

  // Extract only CJK characters from the hanja field (Korean uses traditional hanzi)
  let hanja = ''
  for (const c of rawHanja) {
    const code = c.codePointAt(0)!
    if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf) || c === ' ') {
      hanja += c
    }
  }
  hanja = hanja.trim().replace(/\s+/g, ' ')

  if (!gloss && !hanja) return null

  const definitions = gloss
    .split(/[,/]\s*/)
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .filter((d) => d.length > 0)

  return { hangul, hanja, definitions }
}

export function parseKengdic(text: string): KoEntry[] {
  const lines = text.split('\n')
  const result: KoEntry[] = []
  for (let i = 1; i < lines.length; i++) { // skip header row
    const entry = parseKengdicLine(lines[i])
    if (entry) result.push(entry)
  }
  return result
}

function hasHangul(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if ((c >= 0xac00 && c <= 0xd7a3) || (c >= 0x1100 && c <= 0x11ff) || (c >= 0x3130 && c <= 0x318f)) {
      return true
    }
  }
  return false
}

function hasKana(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if ((c >= 0x3040 && c <= 0x309f) || (c >= 0x30a0 && c <= 0x30ff)) return true
  }
  return false
}

function scoreJa(e: JaEntry, q: string, qLow: string, cjk: boolean, kana: boolean): number {
  if (cjk || kana) {
    if (e.kanji === q || e.reading === q) return 4
    if (e.kanji.includes(q) || e.reading.includes(q)) return 1
    return 0
  }
  // ASCII query: try as romaji and as English definition
  const hiragana = romajiToHiragana(qLow)
  const rd = e.reading
  if (rd === hiragana) return 4
  const fd = (e.definitions[0] ?? '').toLowerCase()
  if (fd === qLow || fd.startsWith(qLow + ' ') || fd.startsWith(qLow + ';')) return 4
  if (wordBoundaryMatch([e.definitions[0] ?? ''], qLow)) return 3
  if (rd.startsWith(hiragana) || wordBoundaryMatch(e.definitions, qLow)) return 2
  if (rd.includes(hiragana) || e.definitions.some((d) => d.toLowerCase().includes(qLow))) return 1
  return 0
}

function scoreKo(e: KoEntry, q: string, qLow: string, cjk: boolean): number {
  if (cjk) {
    if (!e.hanja) return 0
    if (e.hanja === q || e.hanja.replace(/ /g, '') === q) return 4
    if (e.hanja.includes(q)) return 1
    return 0
  }
  if (hasHangul(q)) {
    if (e.hangul === q) return 4
    if (e.hangul.includes(q)) return 1
    return 0
  }
  // ASCII query — search English definitions
  const fd = (e.definitions[0] ?? '').toLowerCase()
  if (fd === qLow || fd.startsWith(qLow + ' ') || fd.startsWith(qLow + ';')) return 4
  if (wordBoundaryMatch([e.definitions[0] ?? ''], qLow)) return 3
  if (wordBoundaryMatch(e.definitions, qLow)) return 2
  if (e.definitions.some((d) => d.toLowerCase().includes(qLow))) return 1
  return 0
}

// CC-CEDICT format: Traditional Simplified [pinyin] /def1/def2/
function parseCedictLine(line: string): ZhEntry | null {
  if (!line || line.charCodeAt(0) === 35) return null // '#'
  const bi = line.indexOf('[')
  if (bi < 2) return null
  const bj = line.indexOf(']', bi)
  if (bj === -1) return null
  const prefix = line.slice(0, bi - 1) // "Traditional Simplified"
  const sp = prefix.indexOf(' ')
  if (sp === -1) return null
  const traditional = prefix.slice(0, sp)
  const simplified = prefix.slice(sp + 1)
  const pinyin = line.slice(bi + 1, bj)
  const di = line.indexOf('/', bj)
  const dj = line.lastIndexOf('/')
  if (di === -1 || di >= dj) return null
  const definitions = line.slice(di + 1, dj).split('/').filter(Boolean)
  return { traditional, simplified, pinyin, definitions }
}

// CC-Canto format: Traditional Simplified [pinyin] {jyutping} /def1/def2/
function parseCantoLine(line: string): YueEntry | null {
  if (!line || line.charCodeAt(0) === 35) return null // '#'
  const bi = line.indexOf('[')
  if (bi < 2) return null
  const bj = line.indexOf(']', bi)
  if (bj === -1) return null
  const ci = line.indexOf('{', bj)
  if (ci === -1) return null
  const cj = line.indexOf('}', ci)
  if (cj === -1) return null
  const prefix = line.slice(0, bi - 1)
  const sp = prefix.indexOf(' ')
  if (sp === -1) return null
  const traditional = prefix.slice(0, sp)
  const simplified = prefix.slice(sp + 1)
  const pinyin = line.slice(bi + 1, bj)
  const jyutping = line.slice(ci + 1, cj)
  const di = line.indexOf('/', cj)
  const dj = line.lastIndexOf('/')
  if (di === -1 || di >= dj) return null
  const definitions = line.slice(di + 1, dj).split('/').filter(Boolean)
  return { traditional, simplified, pinyin, jyutping, definitions }
}

export function parseCedict(text: string): ZhEntry[] {
  const lines = text.split('\n')
  const result: ZhEntry[] = []
  for (const line of lines) {
    const entry = parseCedictLine(line)
    if (entry) result.push(entry)
  }
  return result
}

export function parseCanto(text: string): YueEntry[] {
  const lines = text.split('\n')
  const result: YueEntry[] = []
  for (const line of lines) {
    const entry = parseCantoLine(line)
    if (entry) result.push(entry)
  }
  return result
}

function hasCJK(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf) || (c >= 0xf900 && c <= 0xfaff)) {
      return true
    }
  }
  return false
}

// Strip tone numbers from pinyin (1-5) and jyutping (1-6)
function stripTones(s: string): string {
  return s.replace(/[1-6]/g, '')
}

// True if q appears as a whole word (space/semicolon delimited) in any definition
function wordBoundaryMatch(defs: string[], q: string): boolean {
  return defs.some((d) => {
    const dl = d.toLowerCase()
    return (
      dl === q ||
      dl.startsWith(q + ' ') ||
      dl.startsWith(q + ';') ||
      dl.includes(' ' + q + ' ') ||
      dl.includes(' ' + q + ';') ||
      dl.endsWith(' ' + q)
    )
  })
}

// Scores 4 = exact, 3 = first-def word boundary, 2 = prefix/any word boundary, 1 = substring, 0 = no match.
// The file is NOT sorted by pinyin, so we must scan everything and sort by score rather than stopping early.
function scoreZh(e: ZhEntry, q: string, qLow: string, cjk: boolean): number {
  if (cjk) {
    if (e.traditional === q || e.simplified === q) return 4
    if (e.traditional.includes(q) || e.simplified.includes(q)) return 1
    return 0
  }
  const py = e.pinyin.toLowerCase()
  const pyN = stripTones(py)
  if (pyN === qLow || py === qLow) return 4
  const fd = (e.definitions[0] ?? '').toLowerCase()
  if (fd === qLow || fd.startsWith(qLow + ' ') || fd.startsWith(qLow + ';')) return 4
  if (wordBoundaryMatch([e.definitions[0] ?? ''], qLow)) return 3
  if (pyN.startsWith(qLow) || wordBoundaryMatch(e.definitions, qLow)) return 2
  if (py.includes(qLow) || e.definitions.some((d) => d.toLowerCase().includes(qLow))) return 1
  return 0
}

function scoreYue(e: YueEntry, q: string, qLow: string, cjk: boolean): number {
  if (cjk) {
    if (e.traditional === q || e.simplified === q) return 4
    if (e.traditional.includes(q) || e.simplified.includes(q)) return 1
    return 0
  }
  const jy = e.jyutping.toLowerCase()
  const jyN = stripTones(jy)
  const py = e.pinyin.toLowerCase()
  const pyN = stripTones(py)
  if (jyN === qLow || jy === qLow || pyN === qLow || py === qLow) return 4
  const fd = (e.definitions[0] ?? '').toLowerCase()
  if (fd === qLow || fd.startsWith(qLow + ' ') || fd.startsWith(qLow + ';')) return 4
  if (wordBoundaryMatch([e.definitions[0] ?? ''], qLow)) return 3
  if (jyN.startsWith(qLow) || pyN.startsWith(qLow) || wordBoundaryMatch(e.definitions, qLow)) return 2
  if (jy.includes(qLow) || py.includes(qLow) || e.definitions.some((d) => d.toLowerCase().includes(qLow))) return 1
  return 0
}

type Scored = { zh?: ZhEntry; yue?: YueEntry; ja?: JaEntry[]; ko?: KoEntry; trad: string; simp: string; score: number; favScore: number }

// Per-language lookup indexes, built once per DictDB instance and cached
interface DbIdx {
  zhByTrad: Map<string, ZhEntry>
  zhBySimp: Map<string, ZhEntry>
  yueByTrad: Map<string, YueEntry>
  jaByKanji: Map<string, JaEntry[]>
}
const dbIdxCache = new WeakMap<DictDB, DbIdx>()
function getIdx(db: DictDB): DbIdx {
  const cached = dbIdxCache.get(db)
  if (cached) return cached
  const zhByTrad = new Map<string, ZhEntry>()
  const zhBySimp = new Map<string, ZhEntry>()
  for (const e of db.zh) {
    if (!zhByTrad.has(e.traditional)) zhByTrad.set(e.traditional, e)
    if (!zhBySimp.has(e.simplified)) zhBySimp.set(e.simplified, e)
  }
  const yueByTrad = new Map<string, YueEntry>()
  for (const e of db.yue) {
    if (!yueByTrad.has(e.traditional)) yueByTrad.set(e.traditional, e)
  }
  const jaByKanji = new Map<string, JaEntry[]>()
  for (const e of db.ja) {
    const arr = jaByKanji.get(e.kanji)
    if (arr) arr.push(e)
    else jaByKanji.set(e.kanji, [e])
  }
  const idx: DbIdx = { zhByTrad, zhBySimp, yueByTrad, jaByKanji }
  dbIdxCache.set(db, idx)
  return idx
}

export function search(
  query: string,
  db: DictDB,
  filter: 'all' | LangKey = 'all',
  limit = 50,
  favLang?: LangKey,
): SearchResult[] {
  const q = query.trim()
  if (!q) return []
  const qLow = q.toLowerCase()
  const cjk = hasCJK(q)
  const kana = hasKana(q)

  const byKey = new Map<string, Scored>()
  // simplified → byKey key: lets JA kanji and KO hanja merge into the ZH/YUE card
  // e.g. 猫 (EDICT) merges into 貓/猫 (CC-CEDICT) via simpIndex["猫"] = "貓"
  const simpIndex = new Map<string, string>()

  if (filter === 'all' || filter === 'zh') {
    for (const e of db.zh) {
      const s = scoreZh(e, q, qLow, cjk)
      if (s === 0) continue
      const fav = favLang === 'zh' ? s : 0
      const existing = byKey.get(e.traditional)
      if (existing) {
        if (s > existing.score) existing.score = s
        if (fav > existing.favScore) existing.favScore = fav
        existing.zh = e
      } else {
        byKey.set(e.traditional, { zh: e, trad: e.traditional, simp: e.simplified, score: s, favScore: fav })
        simpIndex.set(e.simplified, e.traditional)
      }
    }
  }

  if (filter === 'all' || filter === 'yue') {
    for (const e of db.yue) {
      const s = scoreYue(e, q, qLow, cjk)
      if (s === 0) continue
      const fav = favLang === 'yue' ? s : 0
      const existing = byKey.get(e.traditional)
      if (existing) {
        if (s > existing.score) existing.score = s
        if (fav > existing.favScore) existing.favScore = fav
        existing.yue = e
      } else {
        byKey.set(e.traditional, { yue: e, trad: e.traditional, simp: e.simplified, score: s, favScore: fav })
        simpIndex.set(e.simplified, e.traditional)
      }
    }
  }

  if (filter === 'all' || filter === 'ja') {
    for (const e of db.ja) {
      const s = scoreJa(e, q, qLow, cjk, kana)
      if (s === 0) continue
      const fav = favLang === 'ja' ? s : 0
      // Merge into ZH/YUE entry whose simplified matches this kanji (e.g. 猫→貓)
      const mergeKey = byKey.has(e.kanji) ? e.kanji : simpIndex.get(e.kanji)
      const existing = mergeKey !== undefined ? byKey.get(mergeKey) : undefined
      if (existing) {
        if (s > existing.score) existing.score = s
        if (fav > existing.favScore) existing.favScore = fav
        if (!existing.ja) {
          existing.ja = [e]
        } else {
          // Deduplicate: skip if a reading with the same hiragana already exists
          const norm = kataToHira(e.reading)
          if (!existing.ja.some((j) => kataToHira(j.reading) === norm)) {
            existing.ja.push(e)
          }
        }
      } else {
        byKey.set(e.kanji, { ja: [e], trad: e.kanji, simp: e.kanji, score: s, favScore: fav })
      }
    }
  }

  if (filter === 'all' || filter === 'ko') {
    for (const e of db.ko) {
      const s = scoreKo(e, q, qLow, cjk)
      if (s === 0) continue
      const fav = favLang === 'ko' ? s : 0
      // Merge into existing CJK entry by hanja (Korean uses traditional hanzi)
      // e.g. hanja="愛" merges into the 愛 card; hanja="見地" merges into 見地 card
      let mergeKey: string | undefined
      if (e.hanja) {
        const h = e.hanja.replace(/ /g, '') // strip internal spaces for key lookup
        mergeKey = byKey.has(h) ? h : (byKey.has(e.hanja) ? e.hanja : simpIndex.get(h) ?? simpIndex.get(e.hanja))
      }
      const existing = mergeKey !== undefined ? byKey.get(mergeKey) : undefined
      if (existing) {
        // Keep the highest-scored KO entry per CJK card
        if (!existing.ko || s > existing.score) {
          if (s > existing.score) existing.score = s
          if (fav > existing.favScore) existing.favScore = fav
          existing.ko = e
        }
      } else {
        byKey.set(e.hangul, { ko: e, trad: e.hangul, simp: e.hangul, score: s, favScore: fav })
      }
    }
  }

  // Cross-language linking: for any CJK result that matched in one language,
  // pull in the same character's entries from other languages regardless of score.
  const idx = getIdx(db)
  for (const scored of byKey.values()) {
    if (!hasCJK(scored.trad)) continue
    if (!scored.zh) {
      scored.zh = idx.zhByTrad.get(scored.trad) ?? idx.zhBySimp.get(scored.trad)
    }
    if (!scored.yue) {
      const tradKey = scored.zh?.traditional ?? scored.trad
      scored.yue = idx.yueByTrad.get(tradKey) ?? idx.yueByTrad.get(scored.trad)
    }
    if (!scored.ja) {
      const entries = idx.jaByKanji.get(scored.trad) ?? idx.jaByKanji.get(scored.simp)
      if (entries && entries.length > 0)
        scored.ja = [...entries].sort((a, b) => (a.archaic ? 1 : 0) - (b.archaic ? 1 : 0))
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // Secondary: prefer results with a direct favLang match over cross-linked ones
      const aFav = a.favScore > 0 ? 1 : 0
      const bFav = b.favScore > 0 ? 1 : 0
      if (bFav !== aFav) return bFav - aFav
      // Tiebreaker: prefer shorter words (single-char beats multi-char at same score)
      return a.trad.length - b.trad.length
    })
    .slice(0, limit)
    .map(({ trad, simp, zh, yue, ja, ko }) => {
      if (ja && ja.length > 1) ja.sort((a, b) => (a.archaic ? 1 : 0) - (b.archaic ? 1 : 0))
      return { traditional: trad, simplified: simp, zh, yue, ja, ko }
    })
}

interface PitchRaw {
  kana: string
  accent: string
  sourceCount: number
  hasNHK: boolean
  sources: string[]
}

function parsePitchCsv(text: string): Map<string, PitchRaw[]> {
  const map = new Map<string, PitchRaw[]>()
  const lines = text.split('\n')
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].charCodeAt(lines[i].length - 1) === 13
      ? lines[i].slice(0, -1) : lines[i]
    if (!line) continue
    const i1 = line.indexOf(',')
    if (i1 === -1) continue
    const word = line.slice(0, i1)
    const r1 = line.slice(i1 + 1)
    const i2 = r1.indexOf(',')
    if (i2 === -1) continue
    const kana = r1.slice(0, i2)
    const r2 = r1.slice(i2 + 1)
    const i3 = r2.indexOf(',')
    if (i3 === -1) continue
    const accent = r2.slice(0, i3)
    const sourcesRaw = r2.slice(i3 + 1)
    const sources = sourcesRaw.split('|').map((s) => s.trim()).filter(Boolean)
    const hasNHK = sources.includes('NHK')
    const sourceCount = sources.length
    const entry: PitchRaw = { kana, accent, sourceCount, hasNHK, sources }
    const existing = map.get(word)
    if (existing) existing.push(entry)
    else map.set(word, [entry])
  }
  return map
}

export function linkPitchAccent(ja: JaEntry[], pitchText: string): void {
  const map = parsePitchCsv(pitchText)
  for (const entry of ja) {
    const hiraReading = kataToHira(entry.reading)
    const candidates = map.get(entry.kanji) ?? map.get(hiraReading) ?? []
    const matching = candidates.filter((a) => a.kana === hiraReading)
    if (matching.length === 0) continue
    matching.sort((a, b) => {
      if (a.hasNHK !== b.hasNHK) return a.hasNHK ? -1 : 1
      return b.sourceCount - a.sourceCount
    })
    entry.pitchAccents = matching.map(({ accent, sourceCount, hasNHK, sources }) => ({ accent, sourceCount, hasNHK, sources }))
  }
}
