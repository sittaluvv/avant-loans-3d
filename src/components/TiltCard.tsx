import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"
import type { ReactNode } from "react"

/** Perspective tilt card with a pointer-following glare. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [10, -10]), { stiffness: 180, damping: 18 })
  const ry = useSpring(useTransform(px, [0, 1], [-12, 12]), { stiffness: 180, damping: 18 })
  const gx = useTransform(px, (v) => `${v * 100}%`)
  const gy = useTransform(py, (v) => `${v * 100}%`)
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(143,211,255,.18), transparent 45%)`
  return (
    <div style={{ perspective: 1100 }} className="h-full">
      <motion.div
        onPointerMove={(e) => {
          if (reduced || e.pointerType !== "mouse") return
          const r = e.currentTarget.getBoundingClientRect()
          px.set((e.clientX - r.left) / r.width); py.set((e.clientY - r.top) / r.height)
        }}
        onPointerLeave={() => { px.set(0.5); py.set(0.5) }}
        style={reduced ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className={`glass relative h-full overflow-hidden rounded-[28px] ${className}`}
      >
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glare }} />
        <div className="relative" style={{ transform: "translateZ(40px)" }}>{children}</div>
      </motion.div>
    </div>
  )
}
