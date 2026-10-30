import { getLang, setLang } from "../i18n/lang"

/** EN | AR segmented switch. Arabic flips the whole page to RTL; choice persists. */
export function LangSwitch({ dark = false }: { dark?: boolean }) {
  const cur = getLang()
  const seg = (l: "en" | "ar", label: string) => (
    <button type="button" lang={l} aria-pressed={cur === l} onClick={() => cur !== l && setLang(l)} data-testid={`lang-${l}`}
      className={`min-h-9 min-w-9 rounded-full px-2 text-xs font-bold transition-colors ${cur === l ? (dark ? "bg-white text-[#3B2BBF]" : "bg-[#3B2BBF] text-white") : dark ? "text-white/80" : "text-slate-600"}`}>{label}</button>
  )
  return (
    <div data-no-i18n role="group" aria-label="Language / اللغة"
      className={`inline-flex items-center rounded-full p-1 ${dark ? "bg-white/10 ring-1 ring-white/25" : "bg-white ring-1 ring-[#3B2BBF]/20"}`}>
      {seg("en", "EN")}{seg("ar", "ع")}
    </div>
  )
}
