import { motion, useReducedMotion } from "motion/react"
import { BiLabel } from "../i18n/Ar"
import { pickerLinkProps } from "./LoanTypePicker"

/*
 * Hero background: a still frame of our own handshake clip (scripts/build-hero-photo.py -> public/hero/).
 * Same URLs are preloaded in index.html (fetchpriority=high), so the browser fetches them before JS runs.
 * Desktop/tablet: full-bleed 16:9, handshake on the right. Phone (<640px): 5:6 crop in the top 460px, text below.
 */
const B = `${import.meta.env.BASE_URL}hero/hero-photo-v1`
const PHONE = "(max-width: 639px)"
const set = (ext: string, ws: number[], phone = false) => ws.map((w) => `${B}-${phone ? "phone-" : ""}${w}.${ext} ${w}w`).join(", ")

export function HeroPhoto() {
  const reduced = useReducedMotion()
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex overflow-hidden bg-[#120d33] sm:min-h-[min(88svh,820px)] sm:items-center">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-20 h-[460px] overflow-hidden sm:inset-0 sm:h-auto">
        <picture>
          <source media={PHONE} type="image/avif" srcSet={set("avif", [520, 780], true)} sizes="100vw" />
          <source media={PHONE} type="image/webp" srcSet={set("webp", [520, 780], true)} sizes="100vw" />
          <source type="image/avif" srcSet={set("avif", [960, 1280, 1920])} sizes="100vw" />
          <source type="image/webp" srcSet={set("webp", [960, 1280, 1920])} sizes="100vw" />
          <img
            data-testid="hero-photo"
            src={`${B}-1280.webp`}
            width={1920}
            height={1080}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="hero-kenburns h-full w-full object-cover object-[50%_45%] sm:object-[70%_50%]"
          />
        </picture>
        {/* phone: fade the photo into the indigo text area */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,51,.55)_0%,rgba(18,13,51,.05)_22%,rgba(18,13,51,.1)_55%,rgba(18,13,51,.85)_82%,#120d33_100%)] sm:hidden" />
      </div>
      {/* desktop/tablet readability: indigo left-to-right (unchanged from the video hero) */}
      <div aria-hidden className="absolute inset-0 -z-10 hidden sm:block sm:bg-[linear-gradient(90deg,rgba(26,20,70,.95)_0%,rgba(26,20,70,.9)_34%,rgba(26,20,70,.55)_60%,rgba(26,20,70,.1)_80%,rgba(26,20,70,.2)_100%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 hidden h-40 bg-gradient-to-b from-[#120d33]/70 to-transparent sm:block" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-[392px] pb-14 sm:px-8 sm:pt-32 sm:pb-24">
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
            Simple, transparent personal loans for the Gulf. Apply online and our team will contact you by WhatsApp or email.
          </motion.p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              {...pickerLinkProps}
              data-testid="hero-apply"
              className="inline-flex items-center justify-center rounded-full bg-[#3B2BBF] px-8 py-2.5 text-base font-semibold text-white shadow-[0_16px_40px_-12px_rgba(59,43,191,.95)] ring-1 ring-white/20 transition-transform hover:scale-[1.02] hover:bg-[#4a3bd6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <BiLabel en="Apply for Loan" arClass="!text-white/85" />
            </a>
            <a href="#loan-types" className="text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Browse loan types
            </a>
          </div>
        </div>
      </div>
      {/* curved transition into the light sections */}
      <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-[#F3F0FF] sm:h-12">
        <path d="M0 60V30C240 0 480 0 720 18S1200 52 1440 24V60Z" fill="currentColor" />
      </svg>
    </section>
  )
}
