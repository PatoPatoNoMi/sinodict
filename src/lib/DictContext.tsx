import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SearchResult, WorkerOutMsg, LangKey } from './dictionaries'

type Filter = 'all' | LangKey

interface DictContextValue {
  loading: boolean
  loadError: string | null
  search: (query: string, filter?: Filter, favLang?: LangKey) => Promise<SearchResult[]>
}

const DictContext = createContext<DictContextValue>(null!)

export function DictProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<number, (r: SearchResult[]) => void>>(new Map())
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
        const cb = pendingRef.current.get(msg.id)
        if (cb) {
          pendingRef.current.delete(msg.id)
          cb(msg.results)
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
      pendingRef.current.set(id, resolve)
      workerRef.current.postMessage({ type: 'search', id, query: trimmed, filter, favLang })
    }), [])

  return <DictContext.Provider value={{ loading, loadError, search }}>{children}</DictContext.Provider>
}

export const useDict = () => useContext(DictContext)
