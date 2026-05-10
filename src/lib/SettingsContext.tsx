import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react'

type PinyinMode = 'numbers' | 'diacritics'

interface SettingsCtx {
  pinyinMode: PinyinMode
  setPinyinMode: (m: PinyinMode) => void
}

const Ctx = createContext<SettingsCtx>(null!)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [pinyinMode, setPinyinMode] = useState<PinyinMode>(() => {
    try { return localStorage.getItem('pinyin-mode') === 'numbers' ? 'numbers' : 'diacritics' } catch { return 'diacritics' }
  })

  useLayoutEffect(() => {
    try { localStorage.setItem('pinyin-mode', pinyinMode) } catch { /* ignore */ }
  }, [pinyinMode])

  return <Ctx.Provider value={{ pinyinMode, setPinyinMode }}>{children}</Ctx.Provider>
}

export const useSettings = () => useContext(Ctx)
