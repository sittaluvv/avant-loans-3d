import { Flag } from "./Flag"
import { DIAL_CODES } from "../lib/application"
import { FlagCombobox } from "./FlagCombobox"

const OPTIONS = DIAL_CODES.map((d) => ({ value: d.code, label: d.name, iso: d.iso, hint: d.code }))

/** WhatsApp country code with SVG flags (shared FlagCombobox). Closed: flag + "+966"; list: flag, country (+Arabic), code. */
export function DialCodeCombobox({ value, onChange, size = "md" }: { value: string; onChange: (v: string) => void; size?: "md" | "lg" }) {
  return (
    <FlagCombobox name="whatsapp-dial" testid="dial" options={OPTIONS} value={value} onChange={onChange} label="Country code"
      className={`gap-2 px-3 ${size === "lg" ? "h-14 rounded-2xl" : "rounded-xl py-3"}`}
      listClassName="left-0 w-[min(18rem,calc(100vw-2.5rem))]" listTop={size === "lg" ? "3.5rem" : "3.1rem"}
      trigger={(o) => (<>
        {o ? <Flag iso={o.iso} /> : null}
        <span data-testid="dial-value" className="tabular-nums text-slate-900">{o?.value ?? "+"}</span>
        <span className="sr-only">{o ? `, ${o.label}` : ""}</span>
      </>)} />
  )
}
