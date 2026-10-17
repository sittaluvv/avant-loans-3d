/**
 * Hero 3D scene (lazy chunk): glossy Avant card + gold coins with soft cursor tilt.
 * Lighting is generated (drei Environment + Lightformer), so there are no HDRI downloads.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { ContactShadows, Environment, Float, Lightformer, PerformanceMonitor, RoundedBox } from "@react-three/drei"
import logoWhite from "../assets/logo-white.svg"

const W = 3.4, H = 2.14, D = 0.07

/** Card face drawn on a canvas: indigo→blue gradient, sheen, white logo, EMV-style chip, contactless mark. No numbers. */
function useCardTexture() {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null)
  useEffect(() => {
    const c = document.createElement("canvas"); c.width = 1360; c.height = 856
    const g = c.getContext("2d")!
    const r = 64
    g.beginPath(); g.roundRect(0, 0, c.width, c.height, r); g.clip()
    const bg = g.createLinearGradient(0, 0, c.width, c.height)
    bg.addColorStop(0, "#2A1D9E"); bg.addColorStop(0.55, "#3B2BBF"); bg.addColorStop(1, "#2F6BFF")
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height)
    // soft light bands
    const sheen = g.createLinearGradient(0, c.height, c.width, 0)
    sheen.addColorStop(0.35, "rgba(255,255,255,0)"); sheen.addColorStop(0.5, "rgba(255,255,255,.16)"); sheen.addColorStop(0.62, "rgba(255,255,255,0)")
    g.fillStyle = sheen; g.fillRect(0, 0, c.width, c.height)
    // fine concentric arcs (guilloché-like texture)
    g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 2
    for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(c.width * 1.02, c.height * 1.1, 260 + i * 34, Math.PI, Math.PI * 1.5); g.stroke() }
    // chip
    const cx = 110, cy = 330, cw = 170, ch = 128
    const chip = g.createLinearGradient(cx, cy, cx + cw, cy + ch)
    chip.addColorStop(0, "#F7DD8A"); chip.addColorStop(0.5, "#D9A93E"); chip.addColorStop(1, "#F3D27A")
    g.fillStyle = chip; g.beginPath(); g.roundRect(cx, cy, cw, ch, 22); g.fill()
    g.strokeStyle = "rgba(120,80,10,.45)"; g.lineWidth = 3
    for (const y of [cy + 42, cy + 86]) { g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + cw, y); g.stroke() }
    g.beginPath(); g.moveTo(cx + cw / 2, cy); g.lineTo(cx + cw / 2, cy + ch); g.stroke()
    // contactless
    g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 9; g.lineCap = "round"
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(c.width - 170, 395, 22 + i * 24, -Math.PI / 3.2, Math.PI / 3.2); g.stroke() }
    // label
    g.fillStyle = "rgba(255,255,255,.78)"; g.font = '600 40px "Plus Jakarta Sans Variable", sans-serif'
    g.fillText("PERSONAL FINANCE", 110, 760)
    const img = new Image()
    img.onload = () => {
      const lw = 520, lh = lw * (148 / 467)
      g.drawImage(img, 108, 96, lw, lh)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true
      setTex(t)
    }
    img.src = logoWhite
  }, [])
  return tex
}

function Card() {
  const tex = useCardTexture()
  return (
    <group>
      <RoundedBox args={[W, H, D]} radius={0.13} smoothness={6} castShadow>
        <meshPhysicalMaterial color="#2C20A8" metalness={0.35} roughness={0.28} clearcoat={1} clearcoatRoughness={0.08} />
      </RoundedBox>
      {tex && (
        <mesh position={[0, 0, D / 2 + 0.002]}>
          <planeGeometry args={[W - 0.004, H - 0.004]} />
          <meshPhysicalMaterial map={tex} transparent metalness={0.15} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.12} />
        </mesh>
      )}
    </group>
  )
}

function Coin({ position, rotation, scale = 1 }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 64]} />
        <meshStandardMaterial color="#F4C24F" metalness={0.55} roughness={0.28} emissive="#8a5c0c" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.42, 64]} />
        <meshStandardMaterial color="#FFE9A8" metalness={0.5} roughness={0.2} emissive="#9a6a14" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/** Gentle tilt toward the pointer (eased); idle drift when the pointer is still. */
function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const px = state.pointer.x, py = state.pointer.y
    const k = 1 - Math.exp(-dt * 3)
    g.current.rotation.y += ((-0.42 + px * 0.28 + Math.sin(t * 0.35) * 0.04) - g.current.rotation.y) * k
    g.current.rotation.x += ((0.18 - py * 0.18) - g.current.rotation.x) * k
  })
  return <group ref={g}>{children}</group>
}

/** Pause rendering while the hero is off-screen or the tab is hidden. */
function VisibilityPause({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const set = useThree((s) => s.setFrameloop)
  useEffect(() => {
    const el = target.current; if (!el) return
    let onScreen = true
    const apply = () => set(onScreen && !document.hidden ? "always" : "never")
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; apply() }, { rootMargin: "80px" })
    io.observe(el); document.addEventListener("visibilitychange", apply)
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", apply) }
  }, [set, target])
  return null
}

export default function HeroScene({ onReady }: { onReady?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75])
  const camera = useMemo(() => ({ position: [0, 0.1, 8.4] as [number, number, number], fov: 32 }), [])
  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas dpr={dpr} camera={camera} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} shadows={false}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; requestAnimationFrame(() => requestAnimationFrame(() => onReady?.())) }}
        aria-hidden>
        <PerformanceMonitor onDecline={() => setDpr([1, 1.1])} />
        <VisibilityPause target={wrap} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#ffffff" />
        <pointLight position={[2.5, -1, 3]} intensity={6} color="#ffd98a" distance={8} />
        <Rig>
          <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.35}>
            <group rotation={[0, 0, -0.08]}><Card /></group>
          </Float>
          <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.6}>
            <Coin position={[1.35, -1.05, 0.6]} rotation={[1.05, 0.35, 0.5]} scale={0.8} />
          </Float>
          <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
            <Coin position={[-1.95, 1.05, 0.45]} rotation={[0.95, -0.55, -0.35]} scale={0.55} />
          </Float>
          <Float speed={2.1} rotationIntensity={0.7} floatIntensity={0.5}>
            <Coin position={[1.6, 1.25, -0.9]} rotation={[1.2, 0.8, 0.25]} scale={0.45} />
          </Float>
        </Rig>
        <ContactShadows position={[0, -1.85, 0]} opacity={0.32} scale={9} blur={2.6} far={3.5} color="#2a1d6e" />
        <Environment resolution={256}>
          <color attach="background" args={["#8e84d6"]} />
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
            <Lightformer form="ring" color="#9db4ff" intensity={6} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={3} />
            <Lightformer form="rect" color="#C9B8FF" intensity={3} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[10, 2, 1]} />
            <Lightformer form="rect" intensity={0.7} position={[0, 4, 8]} scale={[12, 1.2, 1]} />
          </group>
        </Environment>
      </Canvas>
    </div>
  )
}
