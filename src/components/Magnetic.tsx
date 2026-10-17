import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react"
import { useRef, type ReactNode } from "react"

type Props = { children: ReactNode; href?: string; className?: string; type?: "button" | "submit"; strength?: number; onClick?: () => void }

/** A button/link that leans toward the pointer. Static when reduced motion is on. */
export function Magnetic({ children, href, className = "", type = "button", strength = 0.35, onClick }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 })
  const move = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse" || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const leave = () => { x.set(0); y.set(0) }
  const cls = `group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ${className}`
  const inner = <motion.span style={{ x, y }} className="relative z-10 inline-flex items-center gap-2">{children}</motion.span>
  if (href) {
    return (
      <motion.a ref={ref as React.Ref<HTMLAnchorElement>} href={href} onPointerMove={move} onPointerLeave={leave} style={{ x, y }} className={cls}>
        {inner}
      </motion.a>
    )
  }
  return (
    <motion.button ref={ref as React.Ref<HTMLButtonElement>} type={type} onClick={onClick} onPointerMove={move} onPointerLeave={leave} style={{ x, y }} className={cls}>
      {inner}
    </motion.button>
  )
}
