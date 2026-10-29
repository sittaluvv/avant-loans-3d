import { useEffect, useState } from "react"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { Ar } from "../i18n/Ar"

/** Mobile number rules per dial code (national digits, trunk 0 removed). FORMAT ONLY — not a WhatsApp registration check. */
const RULES: Record<string, RegExp> = {
  "+966": /^5\d{8}$/,          // Saudi mobile: 5X XXX XXXX
  "+971": /^5\d{8}$/,          // UAE mobile: 5X XXX XXXX
  "+974": /^[3567]\d{7}$/,     // Qatar
  "+965": /^[569]\d{7}$/,      // Kuwait
  "+973": /^[36]\d{7}$/,       // Bahrain
  "+968": /^[79]\d{7}$/,       // Oman
  "+1": /^[2-9]\d{2}[2-9]\d{6}$/, // US/Canada NANP
  "+44": /^7\d{9}$/,           // UK mobile
  "+91": /^[6-9]\d{9}$/,       // India mobile
  "+20": /^1[0125]\d{8}$/,     // Egypt mobile
}

export function whatsappFormatOk(dial: string, number: string) {
  const digits = (number || "").replace(/\D/g, "").replace(/^0+/, "")
  const re = RULES[dial]
  return re ? re.test(digits) : digits.length >= 6 && digits.length <= 15
}

/** Live label under the WhatsApp number, debounced. Honest: based on number format only. */
export function WhatsAppStatus({ dial, number }: { dial: string; number: string }) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    if (!(number || "").replace(/\D/g, "")) { setOk(null); return }
    const t = setTimeout(() => setOk(whatsappFormatOk(dial, number)), 300)
    return () => clearTimeout(t)
  }, [dial, number])
  if (ok === null) return null
  const label = ok ? "On WhatsApp" : "Not available for WhatsApp"
  return (
    <div id="whatsapp-status" role="status" aria-live="polite" data-testid="whatsapp-status" data-ok={ok}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <div className="grid">
        <span className="font-semibold">{label}</span>
        <Ar en={label} />
        {!ok && <><span>The number format looks wrong for this country code.</span><Ar en="The number format looks wrong for this country code." /></>}
        <span className="text-xs text-slate-600">Based on number format</span>
        <Ar en="Based on number format" className="text-xs" />
      </div>
    </div>
  )
}
