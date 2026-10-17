/*
 * Hero video sources — the ONLY place to change when swapping the clip.
 * Re-encode a new source with:  ./scripts/encode-hero.sh <input.mp4> [pingpong|crossfade] [speed]
 * (writes src/assets/hero/hero-loop.{mp4,webm} + posters, so usually no code change is needed).
 */
import mp4 from "../assets/hero/hero-loop.mp4"
import webm from "../assets/hero/hero-loop.webm"
import poster from "../assets/hero/hero-poster.webp"
import poster640 from "../assets/hero/hero-poster-640.webp"

export const HERO_MEDIA = { mp4, webm, poster, poster640, objectPosition: "70% center" }
