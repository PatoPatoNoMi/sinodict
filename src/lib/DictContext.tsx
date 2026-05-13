import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SearchResult, SentencePair, WorkerOutMsg, LangKey } from './dictionaries'

type Filter = 'all' | LangKey

interface DictContextValue {
  loading: boolean
  loadError: string | null
  search: (query: string, filter?: Filter, favLang?: LangKey) => Promise<SearchResult[]>
  getSentences: (words: string[], lang: LangKey) => Promise<SentencePair[]>
}

const DictContext = createContext<DictContextValue>(null!)

export function DictProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const pendingSearchRef = useRef<Map<number, (r: SearchResult[]) => void>>(new Map())
  const pendingSentencesRef = useRef<Map<number, (r: SentencePair[]) => void>>(new Map())
  const nextIdRef = useRef(0)

  useEffect(() => {
    const worker = new Worker(new URL('../dictWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<WorkerOutMsg>) => {
      const msg = e.data
      if (msg.type === 'ready') {
        setLoading(false)
      } else if (msg.type === 'error') {
        setLoading(false)
        setLoadError(msg.message)
      } else if (msg.type === 'results') {
        const cb = pendingSearchRef.current.get(msg.id)
        if (cb) {
          pendingSearchRef.current.delete(msg.id)
          cb(msg.results)
        }
      } else if (msg.type === 'sentences') {
        const cb = pendingSentencesRef.current.get(msg.id)
        if (cb) {
          pendingSentencesRef.current.delete(msg.id)
          cb(msg.pairs)
        }
      }
    }

    worker.onerror = () => {
      setLoading(false)
      setLoadError('Failed to load dictionaries')
    }

    return () => worker.terminate()
  }, [])

  const search = useCallback((query: string, filter: Filter = 'all', favLang?: LangKey): Promise<SearchResult[]> =>
    new Promise((resolve) => {
      const trimmed = query.trim()
      if (!trimmed || !workerRef.current) { resolve([]); return }
      const id = nextIdRef.current++
      pendingSearchRef.current.set(id, resolve)
      workerRef.current.postMessage({ type: 'search', id, query: trimmed, filter, favLang })
    }), [])

  const getSentences = useCallback((words: string[], lang: LangKey): Promise<SentencePair[]> =>
    new Promise((resolve) => {
      if (!words.length || !workerRef.current) { resolve([]); return }
      const id = nextIdRef.current++
      pendingSentencesRef.current.set(id, resolve)
      workerRef.current.postMessage({ type: 'sentences', id, words, lang })
    }), [])

  return <DictContext.Provider value={{ loading, loadError, search, getSentences }}>{children}</DictContext.Provider>
}

export const useDict = () => useContext(DictContext)
