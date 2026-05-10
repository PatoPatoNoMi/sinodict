import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DictProvider } from './lib/DictContext'
import { SettingsProvider } from './lib/SettingsContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SettingsProvider>
        <DictProvider>
          <App />
        </DictProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
