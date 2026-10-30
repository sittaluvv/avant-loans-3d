import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { initLang } from "./i18n/lang"
initLang()
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css"
import V2App from "./v2/V2App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <V2App />
  </StrictMode>,
)
