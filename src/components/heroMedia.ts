/*
 * Hero video sources — the ONLY place to change when swapping the clip.
 * Current clip ("story"): code-rendered loan form + APPROVED stamp -> crossfade -> slowed handshake, seamless loop.
 * Rebuild with: ./scripts/build-hero-story.sh <landscape_frames> <portrait_frames> <handshake.mp4>
 * (single-clip alternative: ./scripts/encode-hero.sh <input.mp4> [pingpong|crossfade] -> hero-loop.*)
 */
import mp4 from "../assets/hero/hero-story.mp4"
import webm from "../assets/hero/hero-story.webm"
import poster from "../assets/hero/hero-story-poster.webp"
import poster640 from "../assets/hero/hero-story-poster-640.webp"
import phoneMp4 from "../assets/hero/hero-story-phone.mp4"
import phoneWebm from "../assets/hero/hero-story-phone.webm"
import phonePoster from "../assets/hero/hero-story-phone-poster.webp"

/** Below this width the portrait (9:16) cut is used: paper centred, logo + APPROVED in the top half. */
export const PHONE_QUERY = "(max-width: 639px)"

export const HERO_MEDIA = {
  desktop: { mp4, webm, poster, poster640, objectPosition: "center center" },
  phone: { mp4: phoneMp4, webm: phoneWebm, poster: phonePoster, objectPosition: "center top" },
}
