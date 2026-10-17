/** Small SVG flags (flag-icons, MIT, 4:3). Only the flags we need are imported. Emoji flags do not render on Windows. */
import { Globe } from "lucide-react"
import ae from "flag-icons/flags/4x3/ae.svg"
import sa from "flag-icons/flags/4x3/sa.svg"
import qa from "flag-icons/flags/4x3/qa.svg"
import kw from "flag-icons/flags/4x3/kw.svg"
import bh from "flag-icons/flags/4x3/bh.svg"
import om from "flag-icons/flags/4x3/om.svg"
import jo from "flag-icons/flags/4x3/jo.svg"
import eg from "flag-icons/flags/4x3/eg.svg"
import lb from "flag-icons/flags/4x3/lb.svg"
import gb from "flag-icons/flags/4x3/gb.svg"
import us from "flag-icons/flags/4x3/us.svg"

export const FLAG_SVG: Record<string, string> = { ae, sa, qa, kw, bh, om, jo, eg, lb, gb, us }

/** iso: lower-case ISO 3166-1 alpha-2, or "" for the globe ("Other"). Decorative (the text next to it names the country). */
export function Flag({ iso, className = "h-[15px] w-5" }: { iso?: string; className?: string }) {
  const src = iso ? FLAG_SVG[iso] : undefined
  if (!src) return <span aria-hidden className={`inline-flex flex-none items-center justify-center rounded-[3px] bg-[#3B2BBF]/10 text-[#3B2BBF] ${className}`}><Globe className="h-3 w-3" /></span>
  return <img src={src} alt="" aria-hidden width={20} height={15} decoding="async" className={`flex-none rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(15,23,42,.12)] ${className}`} />
}
