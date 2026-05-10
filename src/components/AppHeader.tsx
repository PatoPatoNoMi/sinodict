import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import { useSettings } from '../lib/SettingsContext'
import { SunIcon, MoonIcon } from './shared'

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function AppHeader() {
  const [theme, setTheme] = useTheme()
  const { pinyinMode, setPinyinMode } = useSettings()
  const [open, setOpen] = useState(false)

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-logo">
          <span className="logo-sino">Sino</span>Dict
        </Link>
        <div className="header-actions">
          <Link to="/about" className="header-icon-btn" aria-label="About">
            <InfoIcon />
          </Link>
          <button
            className={`header-icon-btn${open ? ' active' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Settings"
            aria-expanded={open}
            type="button"
          >
            <GearIcon />
          </button>
        </div>
      </div>

      {open && (
        <div className="settings-panel">
          <div className="settings-panel-inner">
            <div className="settings-row">
              <span className="settings-label">Theme</span>
              <div className="settings-seg">
                <button
                  type="button"
                  className={theme === 'light' ? 'active' : ''}
                  onClick={() => setTheme('light')}
                >
                  <SunIcon /> Light
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'active' : ''}
                  onClick={() => setTheme('dark')}
                >
                  <MoonIcon /> Dark
                </button>
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-label">Pinyin</span>
              <div className="settings-seg">
                <button
                  type="button"
                  className={pinyinMode === 'diacritics' ? 'active' : ''}
                  onClick={() => setPinyinMode('diacritics')}
                >
                  Diacritics <span className="settings-eg">sēn ài</span>
                </button>
                <button
                  type="button"
                  className={pinyinMode === 'numbers' ? 'active' : ''}
                  onClick={() => setPinyinMode('numbers')}
                >
                  Numbers <span className="settings-eg">sen1 ai4</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
