import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initLang } from './i18n/lang'
initLang()
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
