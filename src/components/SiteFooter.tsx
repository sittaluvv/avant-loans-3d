import { Logo } from "./Logo"
import { CONTACT } from "../config/contact"
import { Ar } from "../i18n/Ar"
import { SecureNote } from "./LoanInfo"
import { COMPANY_LINE, COPYRIGHT, REGULATORY_LINE } from "../lib/legal"

/** Shared footer (home + apply): tagline, company + licence line with the regulatory note (small muted text), ©. */
export function SiteFooter() {
  return (
    <footer data-testid="site-footer" className="relative z-10 border-t border-[#3B2BBF]/10 bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Logo className="h-11" />
        <p className="mt-3 max-w-sm text-sm text-slate-600">Simple, transparent personal loans for the Gulf.</p>
        <div data-testid="footer-contact" className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <div><p className="font-semibold">Contact us<Ar en="Contact us" /></p>
            {CONTACT.phone && <a href={`tel:${CONTACT.phone}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-[#3B2BBF] underline-offset-2 hover:underline">{CONTACT.phoneDisplay}</a>}
            {CONTACT.email && <a href={`mailto:${CONTACT.email}`} className="block min-h-11 text-[#3B2BBF]">{CONTACT.email}</a>}
          </div>
          <div className="sm:col-span-2"><p className="font-semibold">Address<Ar en="Address" /></p>
            <a href="https://www.google.com/maps/place/Meydan+Free+Zone/@25.1568958,55.3005168,17z" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-slate-700 underline-offset-2 hover:underline">{CONTACT.address}</a>
          </div>
        </div>
        <div className="mt-4"><SecureNote /></div>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs leading-relaxed text-slate-500 md:flex-row md:items-end md:justify-between md:gap-10">
          <p data-testid="company-line" className="max-w-3xl">
            <span className="font-medium text-slate-600">{COMPANY_LINE}</span> {REGULATORY_LINE}
          </p>
          <p className="flex-none">{COPYRIGHT}</p>
        </div>
      </div>
    </footer>
  )
}
