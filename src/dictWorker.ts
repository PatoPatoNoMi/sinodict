import type { WorkerInMsg, WorkerOutMsg, DictDB } from './lib/dictionaries'
import { parseCedict, parseCanto, parseEdict, parseKengdic, parseZhFreq, parseSentences, linkPitchAccent, search, findSentences } from './lib/dictionaries'
import cedictUrl from './dictionaries/cedict_ts.u8?url'
import cantoUrl from './dictionaries/cccanto-webdist.txt?url'
import edictUrl from './dictionaries/edict.txt?url'
import kengdicUrl from './dictionaries/kengdic.tsv?url'
import pitchUrl from './dictionaries/pitch_accent_dataset.csv?url'
import zhFreqUrl from './dictionaries/zh_freq.csv?url'
import sentencesJaUrl from './dictionaries/Sentence pairs in Japanese-English - 2026-05-12.tsv?url'
import sentencesZhUrl from './dictionaries/Sentence pairs in Mandarin Chinese-English - 2026-05-13.tsv?url'
import sentencesYueUrl from './dictionaries/Sentence pairs in Cantonese-English - 2026-05-13.tsv?url'
import sentencesKoUrl from './dictionaries/Sentence pairs in Korean-English - 2026-05-13.tsv?url'

let db: DictDB = { zh: [], yue: [], ja: [], ko: [], zhFreq: new Map(), sentencesJa: [], sentencesZh: [], sentencesYue: [], sentencesKo: [] }

function post(msg: WorkerOutMsg): void {
  self.postMessage(msg)
}

self.addEventListener('message', (e: Event) => {
  const msg = (e as MessageEvent).data as WorkerInMsg
  if (msg.type === 'search') {
    post({ type: 'results', id: msg.id, results: search(msg.query, db, msg.filter, 50, msg.favLang) })
  } else if (msg.type === 'sentences') {
    const pool = msg.lang === 'zh' ? db.sentencesZh : msg.lang === 'yue' ? db.sentencesYue : msg.lang === 'ko' ? db.sentencesKo : db.sentencesJa
    post({ type: 'sentences', id: msg.id, pairs: findSentences(msg.words, pool) })
  }
})

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`)
  return r.text()
}

async function load(): Promise<void> {
  try {
    const [cedictText, cantoText, edictText, kengdicText, pitchText, zhFreqText, sentJaText, sentZhText, sentYueText, sentKoText] = await Promise.all([
      fetchText(cedictUrl),
      fetchText(cantoUrl),
      fetchText(edictUrl),
      fetchText(kengdicUrl),
      fetchText(pitchUrl),
      fetchText(zhFreqUrl),
      fetchText(sentencesJaUrl),
      fetchText(sentencesZhUrl),
      fetchText(sentencesYueUrl),
      fetchText(sentencesKoUrl),
    ])
    const ja = parseEdict(edictText)
    linkPitchAccent(ja, pitchText)
    db = {
      zh: parseCedict(cedictText),
      yue: parseCanto(cantoText),
      ja,
      ko: parseKengdic(kengdicText),
      zhFreq: parseZhFreq(zhFreqText),
      sentencesJa: parseSentences(sentJaText),
      sentencesZh: parseSentences(sentZhText),
      sentencesYue: parseSentences(sentYueText),
      sentencesKo: parseSentences(sentKoText),
    }
    post({ type: 'ready' })
  } catch (err) {
    post({ type: 'error', message: String(err) })
  }
}

load()
