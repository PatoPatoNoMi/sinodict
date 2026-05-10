import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DictProvider } from './lib/DictContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DictProvider>
        <App />
      </DictProvider>
    </BrowserRouter>
  </StrictMode>,
)
