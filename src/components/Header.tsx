import { useEffect, useState } from "react"
import { Magnetic } from "./Magnetic"
import { Logo } from "./Logo"

export const BASE = import.meta.env.BASE_URL // "/avant-loans-3d/"
export const APPLY_URL = `${BASE}apply/`

export function Header({ onApplyPage = false }: { onApplyPage?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className={`mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2 transition-all duration-500 sm:px-6 ${scrolled || onApplyPage ? "glass shadow-[0_10px_40px_-15px_rgba(0,0,0,.8)]" : "border border-transparent"}`}>
        <a href={BASE} aria-label="Avant Loans Middle East home" className="rounded-lg"><Logo className="h-9 sm:h-11" /></a>
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm text-mist md:flex">
          <a href={`${BASE}#benefits`} className="hover:text-frost">Why Avant</a>
          <a href={`${BASE}#how`} className="hover:text-frost">How it works</a>
          <a href={APPLY_URL} aria-current={onApplyPage ? "page" : undefined} className={onApplyPage ? "text-frost" : "hover:text-frost"}>Apply</a>
        </nav>
        {onApplyPage ? (
          <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-100 sm:text-sm">Demo only</span>
        ) : (
          <Magnetic href={APPLY_URL} strength={0.25} className="bg-electric px-5 py-2.5 text-sm text-white shadow-[0_0_30px_-4px_rgba(13,91,255,.9)] hover:bg-ion">
            Apply now
          </Magnetic>
        )}
      </div>
    </header>
  )
}
