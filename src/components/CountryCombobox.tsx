import { Flag } from "./Flag"
import { Ar } from "../i18n/Ar"
import { COUNTRIES, COUNTRY_ISO } from "../lib/application"
import { FlagCombobox } from "./FlagCombobox"

const OPTIONS = COUNTRIES.map((c) => ({ value: c, label: c, iso: COUNTRY_ISO[c] }))

/**
 * Country field with SVG flags (shared FlagCombobox). Hidden required #country carries the value for validation.
 * floating: label sits inside the box (apply-v2); otherwise the label is visually hidden like the other /apply fields.
 */
export function CountryCombobox({ value, onChange, label = "Country", floating = false }: { value: string; onChange: (v: string) => void; label?: string; floating?: boolean }) {
  return (
    <FlagCombobox name="country" testid="country" options={OPTIONS} value={value} onChange={onChange} label={label}
      className={`rounded-xl px-4 ${floating ? "h-14 rounded-2xl" : "py-3"}`} listTop={floating ? "3.5rem" : "3.1rem"}
      trigger={(o) => (<>
        {o ? <Flag iso={o.iso} /> : null}
        <span className="min-w-0 flex-1">
          {floating && <span className={`block font-medium transition-all ${value ? "text-xs text-[#3B2BBF]" : "text-[15px] text-slate-500"}`}>{label}<span aria-hidden className="text-[#3B2BBF]"> *</span></span>}
          {value ? <span data-testid="country-value" className="block truncate text-slate-900">{value}</span> : !floating && <span className="block text-slate-400">{label}</span>}
        </span>
      </>)}
      below={<Ar en={value || label} className="mt-1 px-1 text-[13px]" />} />
  )
}
