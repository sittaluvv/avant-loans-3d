import { Mail, MessageCircle } from "lucide-react"
import { CONTACT, hasContactOptions, whatsappHref } from "../config/contact"

/** WhatsApp / email buttons from src/config/contact.ts. Renders nothing until real details are filled in. */
export function ContactOptions({ dark = false }: { dark?: boolean }) {
  if (!hasContactOptions()) return null
  const btn = `inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
    dark ? "border border-white/25 text-white hover:bg-white/10 focus-visible:outline-white" : "border border-[#3B2BBF]/25 text-[#3B2BBF] hover:bg-[#3B2BBF]/5 focus-visible:outline-[#3B2BBF]"}`
  return (
    <div data-testid="contact-options" className="flex flex-wrap items-center gap-3">
      {CONTACT.whatsapp.replace(/\D/g, "") && (
        <a href={whatsappHref(CONTACT.whatsapp)} target="_blank" rel="noopener noreferrer" className={btn}>
          <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp us
        </a>
      )}
      {CONTACT.email.trim() && (
        <a href={`mailto:${CONTACT.email.trim()}`} className={btn}><Mail aria-hidden className="h-4 w-4" /> Email us</a>
      )}
    </div>
  )
}
