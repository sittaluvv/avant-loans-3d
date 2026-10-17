import { lazy, Suspense, useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import poster from "../assets/v2/hero-3d-poster.webp"

const HeroScene = lazy(() => import("./HeroScene"))

/** Can this device run the 3D hero comfortably? Otherwise the poster stays. */
function canRun3D() {
  if (typeof window === "undefined") return false
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
  if (nav.connection?.saveData) return false
  if ((nav.deviceMemory ?? 8) < 4) return false
  if ((nav.hardwareConcurrency ?? 8) < 4) return false
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")) } catch { return false }
}

/** Poster first (LCP + fallback); the WebGL scene mounts after idle and fades in over it. */
export function Hero3D() {
  const reduced = useReducedMotion()
  const [mount, setMount] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (reduced || !canRun3D()) return
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const go = () => setMount(true)
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 600)
  }, [reduced])
  return (
    <div data-testid="hero-3d" data-state={ready ? "3d" : "poster"} className="relative aspect-[5/4] w-full sm:aspect-[4/3] lg:aspect-square">
      <div aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(47,107,255,.28),rgba(59,43,191,.14)_45%,transparent_70%)] blur-2xl" />
      <img src={poster} alt="Avant Middle East card with gold coins" width={1200} height={1200} fetchPriority="high" decoding="async"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} />
      {mount && (
        <Suspense fallback={null}>
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
            <HeroScene onReady={() => setReady(true)} />
          </div>
        </Suspense>
      )}
    </div>
  )
}
