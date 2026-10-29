import { createContext, useContext } from "react"
import { AlertCircle } from "lucide-react"
import { Ar } from "../i18n/Ar"

/** Per-field validation messages (C2: text + icon, never colour alone). Provided by the form from app.fieldErrors. */
export const FieldErrorsContext = createContext<Record<string, string>>({})
export const useFieldError = (key: string) => useContext(FieldErrorsContext)[key] || ""
export const errId = (key: string) => `${key}-error`
/** aria-describedby helper: joins the ids that exist. */
export const describedBy = (...ids: (string | false | undefined | null)[]) => ids.filter(Boolean).join(" ") || undefined

export function FieldError({ id, className = "", dark = false }: { id: string; className?: string; dark?: boolean }) {
  const msg = useFieldError(id)
  if (!msg) return null
  return (
    <p id={errId(id)} data-testid={`${id}-error`} className={`mt-1.5 flex items-start gap-1.5 px-1 text-sm font-medium ${dark ? "text-rose-200" : "text-[#c70036]"} ${className}`}>
      <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 flex-none" />
      <span className="min-w-0">{msg}<Ar en={msg} className={dark ? "!text-rose-200/90" : "!text-[#c70036]/90"} /></span>
    </p>
  )
}
