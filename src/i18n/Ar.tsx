import { ar } from "./ar"

/** Small muted Arabic line under (or after) the English text it translates. Renders nothing if there is no translation. */
export function Ar({ en, className = "", inline = false, text }: { en?: string | null; className?: string; inline?: boolean; text?: string }) {
  const t = text ?? ar(en)
  if (!t) return null
  return <span lang="ar" dir="rtl" className={`ar-sub ${inline ? "inline-block" : "block"} ${className}`}>{t}</span>
}

/** "English · العربية" for native <option> text, which cannot hold a second line. */
export const bi = (en: string) => { const t = ar(en); return t ? `${en} · ${t}` : en }
