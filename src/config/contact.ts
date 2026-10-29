/**
 * Direct contact options shown on the homepage (v2).
 * Leave a value EMPTY to hide its button. Do not put placeholder or fake details here.
 *   whatsapp: full international number, digits only, e.g. "9715XXXXXXXX" (no +, spaces or dashes)
 *   email:    a monitored address, e.g. "hello@your-domain"
 */
export const CONTACT = {
  whatsapp: "",
  email: "apply@avant-middle-east.com",
  /** Business phone shown in the footer (tel: link). Ronald-provided Dubai number. */
  phone: "+971501793501",
  phoneDisplay: "+971 50 179 3501",
  address: "Meydan Grandstand, 6th Floor, Al Meydan Rd, Nad Al Sheba 1, Dubai, UAE",
} as const

export const whatsappHref = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`
export const hasContactOptions = () => Boolean(CONTACT.whatsapp.replace(/\D/g, "") || CONTACT.email.trim())
