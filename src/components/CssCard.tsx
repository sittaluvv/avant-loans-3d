/** Pure-CSS 3D card shown while the WebGL scene loads, or when WebGL is unavailable. */
export function CssCard({ animate = true }: { animate?: boolean }) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ perspective: 1200 }} aria-hidden>
      <div
        className={`relative aspect-[1.586] w-[78%] max-w-[460px] rounded-[22px] p-6 text-white shadow-[0_40px_120px_-20px_rgba(13,91,255,.8)] ${animate ? "animate-[cardfloat_7s_ease-in-out_infinite]" : ""}`}
        style={{ transform: "rotateX(14deg) rotateY(-24deg)", background: "linear-gradient(135deg,#0b2a8a,#0d5bff 55%,#061649)" }}
      >
        <div className="absolute inset-0 rounded-[22px] bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.18)_45%,transparent_60%)]" />
        <p className="font-display text-3xl font-bold">AVANT</p>
        <p className="font-display text-[10px] tracking-wide opacity-80">LOANS MIDDLE EAST</p>
        <div className="mt-6 h-10 w-14 rounded-lg bg-gradient-to-br from-[#f6e7b0] to-[#b9953f]" />
        <p className="absolute bottom-6 left-6 font-display text-sm opacity-90">4026 •••• •••• 2026</p>
      </div>
      <style>{`@keyframes cardfloat{0%,100%{transform:rotateX(14deg) rotateY(-24deg) translateY(0)}50%{transform:rotateX(8deg) rotateY(-14deg) translateY(-14px)}}`}</style>
    </div>
  )
}
