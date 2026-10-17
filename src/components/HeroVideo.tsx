import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { APPLY_URL } from "./Header"
import { HERO_MEDIA, PHONE_QUERY } from "./heroMedia"

const { desktop, phone } = HERO_MEDIA

/** Picks the portrait cut on phones; re-evaluates on resize/rotation. */
function useIsPhone() {
  const [isPhone, setIsPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches)
  useEffect(() => {
    const m = window.matchMedia(PHONE_QUERY)
    const on = () => setIsPhone(m.matches)
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [])
  return isPhone
}

/** Saves data / reduced motion -> poster only. */
function useVideoAllowed() {
  const reduced = useReducedMotion()
  const [saveData, setSaveData] = useState(false)
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setSaveData(!!c?.saveData)
  }, [])
  return !reduced && !saveData
}

export function HeroVideo() {
  const reduced = useReducedMotion()
  const allowVideo = useVideoAllowed()
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const isPhone = useIsPhone()
  const media = isPhone ? phone : desktop

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    v.play().catch(() => {}) // autoplay may be blocked; poster stays visible
  }, [allowVideo, isPhone])

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[640px] items-end overflow-hidden bg-[#120d33] sm:min-h-[min(88svh,820px)] sm:items-center">
      {/* Poster: always present (LCP image, reduced-motion / data-saver fallback) */}
      <picture>
        <source media={PHONE_QUERY} srcSet={phone.poster} />
        <img
          src={desktop.poster}
          srcSet={`${desktop.poster640} 640w, ${desktop.poster} 1280w`}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-top sm:object-center"
        />
      </picture>
      {allowVideo && (
        <video
          key={isPhone ? "phone" : "desktop"}
          ref={ref}
          style={{ objectPosition: media.objectPosition }}
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={media.poster}
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          onPlaying={() => setPlaying(true)}
        >
          <source src={media.webm} type="video/webm" />
          <source src={media.mp4} type="video/mp4" />
        </video>
      )}
      {/* Readability overlays: indigo left-to-right on desktop, bottom-up on phone, soft vignette, fade into the light page */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(18,13,51,.94)_0%,rgba(26,20,70,.78)_45%,rgba(26,20,70,.25)_75%,rgba(26,20,70,.35)_100%)] sm:bg-[linear-gradient(90deg,rgba(26,20,70,.95)_0%,rgba(26,20,70,.9)_34%,rgba(26,20,70,.55)_60%,rgba(26,20,70,.1)_80%,rgba(26,20,70,.2)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,transparent_35%,rgba(10,8,30,.35)_100%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-28 pb-14 sm:px-8 sm:pt-32 sm:pb-24">
        <div className="max-w-xl">
          <motion.h1
            id="hero-title"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="font-display text-[clamp(2.4rem,5.6vw,4.1rem)] font-extrabold leading-[1.05] tracking-tight text-white [text-shadow:0_2px_24px_rgba(10,8,30,.45)]"
          >
            Move forward with a <span className="text-[#C9D6FF]">personal loan</span>
          </motion.h1>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-5 max-w-md text-lg leading-relaxed text-white/85"
          >
            Simple, fast, and transparent. Check your options in minutes — then manage everything from your phone.
          </motion.p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={APPLY_URL}
              className="inline-flex items-center justify-center rounded-full bg-[#3B2BBF] px-8 py-3.5 text-base font-semibold text-white shadow-[0_16px_40px_-12px_rgba(59,43,191,.95)] ring-1 ring-white/20 transition-transform hover:scale-[1.02] hover:bg-[#4a3bd6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Apply for Loan
            </a>
            <a href="#loan-types" className="text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Browse loan types
            </a>
          </div>
          <p className="mt-3 text-sm text-white/70">Checking options won’t affect your credit score.</p>
        </div>
      </div>
      {/* curved transition into the light sections */}
      <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-[#F3F0FF] sm:h-12">
        <path d="M0 60V30C240 0 480 0 720 18S1200 52 1440 24V60Z" fill="currentColor" />
      </svg>
    </section>
  )
}
