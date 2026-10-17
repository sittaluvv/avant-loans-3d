import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer, RoundedBox, Sparkles, Float } from "@react-three/drei"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

type Props = { reduced: boolean; active: boolean }

function useCardTexture() {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null)
  useEffect(() => {
    let cancelled = false
    const draw = async () => {
      try { await document.fonts.load('600 80px "Unbounded Variable"') } catch { /* fallback font */ }
      const c = document.createElement("canvas")
      c.width = 1024; c.height = 640
      const g = c.getContext("2d")!
      const bg = g.createLinearGradient(0, 0, 1024, 640)
      bg.addColorStop(0, "#0b2a8a"); bg.addColorStop(0.55, "#0d5bff"); bg.addColorStop(1, "#061649")
      g.fillStyle = bg; g.fillRect(0, 0, 1024, 640)
      // light sweep
      const sw = g.createLinearGradient(0, 0, 1024, 0)
      sw.addColorStop(0.2, "rgba(255,255,255,0)"); sw.addColorStop(0.45, "rgba(255,255,255,.18)"); sw.addColorStop(0.6, "rgba(255,255,255,0)")
      g.fillStyle = sw; g.fillRect(0, 0, 1024, 640)
      // circuit lines
      g.strokeStyle = "rgba(143,211,255,.22)"; g.lineWidth = 2
      for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(560 + i * 50, 640); g.lineTo(560 + i * 50, 420 - i * 18); g.lineTo(1024, 300 - i * 22); g.stroke() }
      // chip
      const chip = g.createLinearGradient(80, 230, 220, 330)
      chip.addColorStop(0, "#f6e7b0"); chip.addColorStop(1, "#b9953f")
      g.fillStyle = chip; g.beginPath(); g.roundRect(84, 240, 140, 104, 18); g.fill()
      g.strokeStyle = "rgba(80,60,10,.45)"; g.lineWidth = 3
      g.beginPath(); g.moveTo(84, 292); g.lineTo(224, 292); g.moveTo(154, 240); g.lineTo(154, 344); g.stroke()
      // brand
      g.fillStyle = "#ffffff"; g.font = '700 84px "Unbounded Variable", sans-serif'; g.fillText("AVANT", 84, 160)
      g.fillStyle = "rgba(220,232,255,.85)"; g.font = '500 26px "Unbounded Variable", sans-serif'; g.fillText("LOANS MIDDLE EAST", 88, 200)
      g.fillStyle = "rgba(255,255,255,.92)"; g.font = '500 46px "Unbounded Variable", sans-serif'; g.fillText("4026  ••••  ••••  2026", 84, 470)
      g.fillStyle = "rgba(220,232,255,.75)"; g.font = '500 24px "Unbounded Variable", sans-serif'; g.fillText("DEMO CARD · NOT A REAL PRODUCT", 84, 560)
      // contactless
      g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 6
      for (let r = 0; r < 3; r++) { g.beginPath(); g.arc(300, 292, 24 + r * 18, -0.8, 0.8); g.stroke() }
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
      if (!cancelled) setTex(t)
    }
    draw()
    return () => { cancelled = true }
  }, [])
  return tex
}

function Card({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const tex = useCardTexture()
  const { pointer } = useThree()
  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5)
    const tx = reduced ? -0.25 : -0.35 + pointer.y * -0.25 + scroll * 0.6
    const ty = reduced ? 0.55 : 0.5 + pointer.x * 0.45 + scroll * 2.2 + state.clock.elapsedTime * 0.05
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx, 4, dt)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty, 4, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, scroll * 1.2, 4, dt)
  })
  return (
    <group ref={group}>
      <RoundedBox args={[3.4, 2.14, 0.06]} radius={0.14} smoothness={4}>
        <meshPhysicalMaterial color="#0d3fd0" metalness={0.6} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
      </RoundedBox>
      {tex && (
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[3.2, 2.0]} />
          <meshPhysicalMaterial map={tex} roughness={0.3} metalness={0.25} clearcoat={1} clearcoatRoughness={0.05} transparent />
        </mesh>
      )}
      <mesh position={[0, 0, -0.031]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.2, 2.0]} />
        <meshPhysicalMaterial color="#061649" metalness={0.8} roughness={0.35} clearcoat={1} />
      </mesh>
    </group>
  )
}

function Rings({ reduced }: { reduced: boolean }) {
  const a = useRef<THREE.Mesh>(null!)
  const b = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => {
    if (reduced) return
    a.current.rotation.z += dt * 0.25
    b.current.rotation.z -= dt * 0.18
  })
  return (
    <group rotation={[1.2, 0.2, 0]}>
      <mesh ref={a}>
        <torusGeometry args={[2.6, 0.012, 8, 160]} />
        <meshBasicMaterial color="#3d8bff" toneMapped={false} />
      </mesh>
      <mesh ref={b} rotation={[0.35, 0.4, 0]}>
        <torusGeometry args={[3.1, 0.008, 8, 160]} />
        <meshBasicMaterial color="#8fd3ff" toneMapped={false} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

/** Orbiting "coins" with instancing: one draw call. */
function Coins({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const N = 22
  const data = useMemo(() => Array.from({ length: N }, (_, i) => ({
    r: 2.2 + Math.random() * 1.6, a: (i / N) * Math.PI * 2, y: (Math.random() - 0.5) * 2.2, s: 0.08 + Math.random() * 0.1, sp: 0.15 + Math.random() * 0.2,
  })), [])
  const m = useMemo(() => new THREE.Object3D(), [])
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime
    data.forEach((d, i) => {
      const a = d.a + t * d.sp
      m.position.set(Math.cos(a) * d.r, d.y + Math.sin(t + i) * 0.1, Math.sin(a) * d.r * 0.6 - 0.5)
      m.rotation.set(t + i, t * 0.7 + i, 0)
      m.scale.setScalar(d.s)
      m.updateMatrix()
      ref.current.setMatrixAt(i, m.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <cylinderGeometry args={[1, 1, 0.25, 24]} />
      <meshPhysicalMaterial color="#7fb0ff" emissive="#0d5bff" emissiveIntensity={0.35} metalness={0.55} roughness={0.25} clearcoat={1} />
    </instancedMesh>
  )
}

function Rig({ reduced }: { reduced: boolean }) {
  const { camera, pointer, size } = useThree()
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.position.z = size.width < 700 ? 7.4 : 7
    cam.updateProjectionMatrix()
  }, [camera, size.width])
  useFrame((_, dt) => {
    if (reduced) return
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.4, 2, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.25, 2, dt)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Stage({ children }: { children: React.ReactNode }) {
  const { size } = useThree()
  return <group position-x={size.width > 700 ? 0.55 : 0}>{children}</group>
}

export default function HeroScene({ reduced, active }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? (reduced ? "demand" : "always") : "never"}
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} color="#cfe0ff" />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#0d5bff" />
      <Stage>
      <Float speed={reduced ? 0 : 1.6} rotationIntensity={reduced ? 0 : 0.35} floatIntensity={reduced ? 0 : 0.8}>
        <Card reduced={reduced} />
      </Float>
      <Rings reduced={reduced} />
      <Coins reduced={reduced} />
      </Stage>
      {!reduced && <Sparkles count={70} scale={[10, 6, 4]} size={2.2} speed={0.35} color="#8fd3ff" opacity={0.7} />}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2.5} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#3d8bff" />
        <Lightformer form="ring" intensity={2} position={[4, -2, 3]} scale={3} color="#8fd3ff" />
      </Environment>
      <Rig reduced={reduced} />
    </Canvas>
  )
}
