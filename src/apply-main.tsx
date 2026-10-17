import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css"
import ApplyPage from "./ApplyPage"

createRoot(document.getElementById("root")!).render(<StrictMode><ApplyPage /></StrictMode>)
