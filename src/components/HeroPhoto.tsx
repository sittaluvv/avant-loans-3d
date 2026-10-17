import { motion, useReducedMotion } from "motion/react"
import { BiLabel } from "../i18n/Ar"
import { pickerLinkProps } from "./LoanTypePicker"

/*
 * Hero background: our own generated photo (advisor + client on a Dubai rooftop), scripts/build-hero-photo-v2.py
 * -> public/hero/hero-photo-v2-* (v1 handshake files kept for rollback). Same URLs are preloaded in index.html.
 * The photo is bright (pale sky), so on desktop (>=1024px) it starts 18% in from the left and a deep-indigo panel +
 * gradient carries the white headline (contrast measured in scripts/verify_release.py, >= 4.5:1).
 * Phone/tablet (<1024px): 5:6 crop on the two people in the top 460px, text on indigo below.
 */
const B = `${import.meta.env.BASE_URL}hero/hero-photo-v2`
const PHONE = "(max-width: 1023px)" // phone + tablet: stacked (people crop on top, copy on indigo below)
const set = (ext: string, ws: number[], phone = false) => ws.map((w) => `${B}-${phone ? "phone-" : ""}${w}.${ext} ${w}w`).join(", ")

export function HeroPhoto() {
  const reduced = useReducedMotion()
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex overflow-hidden bg-[#120d33] lg:min-h-[min(88svh,820px)] lg:items-center">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-20 h-[460px] overflow-hidden sm:h-[620px] lg:inset-y-0 lg:left-[18%] lg:right-0 lg:h-auto 2xl:left-[24%]">
        <picture>
          <source media={PHONE} type="image/avif" srcSet={set("avif", [520, 780, 1170], true)} sizes="100vw" />
          <source media={PHONE} type="image/webp" srcSet={set("webp", [520, 780, 1170], true)} sizes="100vw" />
          <source type="image/avif" srcSet={set("avif", [960, 1280, 1920, 2560])} sizes="82vw" />
          <source type="image/webp" srcSet={set("webp", [960, 1280, 1920, 2560])} sizes="82vw" />
          <img
            data-testid="hero-photo"
            src={`${B}-1280.webp`}
            width={1920}
            height={1080}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="hero-kenburns h-full w-full object-cover object-[50%_30%] lg:object-[88%_40%]"
          />
        </picture>
        {/* phone: header scrim on the bright sky, then fade the photo into the indigo text area */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,51,.72)_0%,rgba(18,13,51,.12)_24%,rgba(18,13,51,0)_50%,rgba(18,13,51,.82)_82%,#120d33_100%)] lg:hidden" />
      </div>
      {/* desktop/tablet readability: solid deep-indigo panel under the copy, feathering into the bright photo */}
      <div aria-hidden className="absolute inset-0 -z-10 hidden lg:block lg:bg-[linear-gradient(90deg,#161040_0%,#1a1446_30%,rgba(26,20,70,.95)_40%,rgba(26,20,70,.8)_48%,rgba(26,20,70,.38)_57%,rgba(26,20,70,0)_67%)] 2xl:bg-[linear-gradient(90deg,#161040_0%,#1a1446_34%,rgba(26,20,70,.95)_44%,rgba(26,20,70,.8)_51%,rgba(26,20,70,.36)_60%,rgba(26,20,70,0)_70%)]" />
      {/* soft indigo glow + header scrim + bottom vignette so the nav and curve read on the pale sky */}
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-[radial-gradient(60%_80%_at_8%_45%,rgba(59,43,191,.35),transparent_70%)] lg:block" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 hidden h-36 bg-gradient-to-b from-[#120d33]/75 to-transparent lg:block" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 hidden h-32 bg-gradient-to-t from-[#120d33]/45 to-transparent lg:block" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-[392px] pb-14 sm:px-8 sm:pt-[540px] lg:pt-32 lg:pb-24">
        <div className="max-w-xl">
          <motion.h1
            id="hero-title"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="font-display lg:max-w-[28rem] xl:max-w-none text-[clamp(2.4rem,5.6vw,4.1rem)] font-extrabold leading-[1.05] tracking-tight text-white [text-shadow:0_2px_24px_rgba(10,8,30,.45)]"
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
