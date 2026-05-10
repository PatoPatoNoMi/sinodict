import type { WorkerInMsg, WorkerOutMsg, DictDB } from './lib/dictionaries'
import { parseCedict, parseCanto, parseEdict, parseKengdic, linkPitchAccent, search } from './lib/dictionaries'
import cedictUrl from './dictionaries/cedict_ts.u8?url'
import cantoUrl from './dictionaries/cccanto-webdist.txt?url'
import edictUrl from './dictionaries/edict.txt?url'
import kengdicUrl from './dictionaries/kengdic.tsv?url'
import pitchUrl from './dictionaries/pitch_accent_dataset.csv?url'

let db: DictDB = { zh: [], yue: [], ja: [], ko: [] }

function post(msg: WorkerOutMsg): void {
  self.postMessage(msg)
}

self.addEventListener('message', (e: Event) => {
  const msg = (e as MessageEvent).data as WorkerInMsg
  if (msg.type === 'search') {
    post({ type: 'results', id: msg.id, results: search(msg.query, db, msg.filter, 50, msg.favLang) })
  }
})

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`)
  return r.text()
}

async function load(): Promise<void> {
  try {
    const [cedictText, cantoText, edictText, kengdicText, pitchText] = await Promise.all([
      fetchText(cedictUrl),
      fetchText(cantoUrl),
      fetchText(edictUrl),
      fetchText(kengdicUrl),
      fetchText(pitchUrl),
    ])
    const ja = parseEdict(edictText)
    linkPitchAccent(ja, pitchText)
    db = {
      zh: parseCedict(cedictText),
      yue: parseCanto(cantoText),
      ja,
      ko: parseKengdic(kengdicText),
    }
    post({ type: 'ready' })
  } catch (err) {
    post({ type: 'error', message: String(err) })
  }
}

load()
