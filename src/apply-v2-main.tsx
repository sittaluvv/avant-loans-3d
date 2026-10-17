import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css"
import ApplyV2 from "./apply/ApplyV2"

createRoot(document.getElementById("root")!).render(<StrictMode><ApplyV2 /></StrictMode>)
