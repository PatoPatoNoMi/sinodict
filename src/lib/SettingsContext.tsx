import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react'
import type { LangKey } from './dictionaries'

type PinyinMode = 'numbers' | 'diacritics'
export type FavLang = LangKey | 'none'

const LANG_KEYS: LangKey[] = ['zh', 'yue', 'ja', 'ko']

interface SettingsCtx {
  pinyinMode: PinyinMode
  setPinyinMode: (m: PinyinMode) => void
  favLang: FavLang
  setFavLang: (l: FavLang) => void
}

const Ctx = createContext<SettingsCtx>(null!)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [pinyinMode, setPinyinMode] = useState<PinyinMode>(() => {
    try { return localStorage.getItem('pinyin-mode') === 'numbers' ? 'numbers' : 'diacritics' } catch { return 'diacritics' }
  })

  const [favLang, setFavLang] = useState<FavLang>(() => {
    try {
      const v = localStorage.getItem('fav-lang')
      return LANG_KEYS.includes(v as LangKey) ? (v as LangKey) : 'none'
    } catch { return 'none' }
  })

  useLayoutEffect(() => {
    try { localStorage.setItem('pinyin-mode', pinyinMode) } catch { /* ignore */ }
  }, [pinyinMode])

  useLayoutEffect(() => {
    try { localStorage.setItem('fav-lang', favLang) } catch { /* ignore */ }
  }, [favLang])

  return <Ctx.Provider value={{ pinyinMode, setPinyinMode, favLang, setFavLang }}>{children}</Ctx.Provider>
}

export const useSettings = () => useContext(Ctx)
