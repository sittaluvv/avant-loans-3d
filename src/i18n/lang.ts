import { ar, AR } from "./ar"
import { HOME_AR } from "./home-ar"

/** Whole-UI language switch (EN | AR). Preference persists in localStorage; AR flips the document to RTL. */
export type Lang = "en" | "ar"
const KEY = "avant-lang"
Object.assign(AR, HOME_AR)

export function getLang(): Lang {
  try { const q = new URLSearchParams(location.search).get("lang"); if (q === "ar" || q === "en") { localStorage.setItem(KEY, q); return q } } catch { /* */ }
  try { return localStorage.getItem(KEY) === "ar" ? "ar" : "en" } catch { return "en" }
}
export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l) } catch { /* */ }
  const u = new URL(location.href); u.searchParams.delete("lang"); location.replace(u.toString())
}
export const isAr = () => document.documentElement.lang === "ar"
/** Translate a string for code (chat bot etc.). */
export const tr = (en: string) => (isAr() ? ar(en) ?? en : en)

const BI = /^(.+?) · (.+)$/ // "English · العربية" native <option> labels
const ATTRS = ["placeholder", "aria-label", "title", "alt", "aria-valuetext"]

function xlate(s: string, lang: Lang): string | null {
  const t = s.trim(); if (!t) return null
  const bi = t.match(BI)
  if (bi && !/[\u0600-\u06FF]/.test(bi[1]) && /[\u0600-\u06FF]/.test(bi[2])) return s.replace(t, lang === "ar" ? bi[2] : bi[1])
  if (lang !== "ar") return null
  const a = ar(t); return a && a !== t ? s.replace(t, a) : null
}
function walk(root: Node, lang: Lang) {
  if (root.nodeType === 3) { const v = xlate(root.nodeValue ?? "", lang); if (v !== null && v !== root.nodeValue) root.nodeValue = v; return }
  if (root.nodeType !== 1) return
  const el = root as Element
  if (el.closest("[data-no-i18n],script,style")) return
  for (const a of ATTRS) { const v = el.getAttribute(a); if (v) { const x = xlate(v, lang); if (x !== null && x !== v) el.setAttribute(a, x) } }
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let n: Node | null = w.nextNode()
  while (n) {
    if (n.nodeType === 3) { const p = n.parentElement; if (p && !p.closest("[data-no-i18n],script,style")) { const v = xlate(n.nodeValue ?? "", lang); if (v !== null && v !== n.nodeValue) n.nodeValue = v } }
    else for (const a of ATTRS) { const e = n as Element, v = e.getAttribute(a); if (v) { const x = xlate(v, lang); if (x !== null && x !== v) e.setAttribute(a, x) } }
    n = w.nextNode()
  }
}

/** Call once before React renders. */
export function initLang() {
  const lang = getLang(), h = document.documentElement
  h.lang = lang; h.dir = lang === "ar" ? "rtl" : "ltr"
  h.classList.add(`lang-${lang}`)
  const start = () => {
    walk(document.body, lang)
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") walk(m.target, lang)
        else if (m.type === "attributes") walk(m.target, lang)
        else m.addedNodes.forEach((n) => walk(n, lang))
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS })
  }
  if (document.body) start(); else addEventListener("DOMContentLoaded", start)
}
