import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import cardImg from "@/assets/3d/avant-card.webp"
import houseImg from "@/assets/3d/fluent-house.webp"
import carImg from "@/assets/3d/fluent-car.webp"
import coinImg from "@/assets/3d/fluent-coin.webp"

/** Floating 3D cluster: card + coins + house/car with CSS bob + pointer parallax. */
export function HeroCluster() {
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduced) return
    const el = root.current
    const L = layer.current
    if (!el || !L) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width - 0.5) * 2
        const y = ((e.clientY - r.top) / r.height - 0.5) * 2
        L.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`
      })
    }
    const onLeave = () => { L.style.transform = "rotateY(0deg) rotateX(0deg)" }
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [reduced])

  return (
    <div ref={root} className="relative mx-auto aspect-square w-full max-w-[520px]" style={{ perspective: 1100 }} aria-hidden="true">
      <div className="absolute inset-[12%] rounded-full bg-[#3B2BBF]/20 blur-3xl" />
      <div className="absolute inset-[20%] rounded-full bg-[#F5C451]/15 blur-2xl" />

      <div
        ref={layer}
        className="relative h-full w-full transition-transform duration-300 ease-out will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="bob-slow absolute top-[4%] left-[0%] w-[40%]" style={{ transform: "translateZ(-40px)" }}>
          <img src={houseImg} alt="" width={256} height={256} className="w-full drop-shadow-2xl" />
        </div>
        <div className="bob-slow bob-delay-2 absolute top-[12%] right-[-2%] w-[38%]" style={{ transform: "translateZ(-30px)" }}>
          <img src={carImg} alt="" width={256} height={256} className="w-full drop-shadow-2xl" />
        </div>

        <div className="bob absolute top-[20%] left-[16%] w-[66%]" style={{ transform: "translateZ(40px)" }}>
          <img src={cardImg} alt="" width={1024} height={1024} className="w-full rotate-[-12deg] drop-shadow-[0_30px_50px_rgba(59,43,191,.35)]" />
        </div>

        <div className="bob-coin absolute top-[16%] right-[14%] w-[17%]">
          <img src={coinImg} alt="" width={256} height={256} className="w-full drop-shadow-lg" />
        </div>
        <div className="bob-coin bob-delay-1 absolute bottom-[20%] left-[10%] w-[15%]">
          <img src={coinImg} alt="" width={256} height={256} className="w-full drop-shadow-lg" />
        </div>
        <div className="bob-coin bob-delay-3 absolute bottom-[26%] right-[8%] w-[13%]">
          <img src={coinImg} alt="" width={256} height={256} className="w-full drop-shadow-lg" />
        </div>

        <div className="glass-light bob-delay-1 absolute top-[6%] right-[2%] rounded-full px-3.5 py-2 text-xs font-semibold text-[#3B2BBF] sm:text-sm">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
          Approved in minutes
        </div>
        <div className="glass-light bob bob-delay-2 absolute bottom-[10%] left-[4%] rounded-full px-3.5 py-2 text-xs font-semibold text-slate-800 sm:text-sm">
          <span className="mr-1 text-[#F5C451]">★</span> APR from 4.9%
        </div>
      </div>
    </div>
  )
}
