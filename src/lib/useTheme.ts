import { useState, useLayoutEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' }
  })

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch { /* ignore */ }
  }, [theme])

  return [theme, setTheme] as const
}
