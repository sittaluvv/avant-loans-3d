import { useEffect, useRef, useState, type DragEvent } from "react"
import { Camera, FileText, Lock, RefreshCw, Trash2 } from "lucide-react"
import { Ar } from "../i18n/Ar"
import { AR } from "../i18n/ar"
import { ID_ACCEPT, type IdFiles, type IdSide } from "../components/IdUpload"

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/** ID-card outline illustration for the empty dropzone (decorative). */
function CardOutline({ passport }: { passport: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 160 104" className="mx-auto h-[72px] w-auto text-[#3B2BBF]">
      <rect x="3" y="3" width="154" height="98" rx="12" fill="#F3F0FF" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" strokeDasharray="6 5" />
      <rect x="16" y="22" width="40" height="50" rx="7" fill="#fff" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <circle cx="36" cy="40" r="8" fill="currentColor" fillOpacity=".22" />
      <path d="M23 64c3-9 23-9 26 0" fill="currentColor" fillOpacity=".22" />
      <rect x="66" y="26" width="72" height="7" rx="3.5" fill="currentColor" fillOpacity=".28" />
      <rect x="66" y="41" width="56" height="6" rx="3" fill="currentColor" fillOpacity=".18" />
      <rect x="66" y="54" width="64" height="6" rx="3" fill="currentColor" fillOpacity=".18" />
      {passport
        ? <path d="M16 84h128M16 91h128" stroke="currentColor" strokeOpacity=".22" strokeWidth="3" strokeDasharray="4 3" />
        : <rect x="66" y="74" width="40" height="10" rx="3" fill="#2F6BFF" fillOpacity=".25" />}
    </svg>
  )
}

function Zone({ side, label, optional, passport, file, error, onFile, onRemove }: {
  side: IdSide; label: string; optional?: boolean; passport: boolean; file?: File; error?: string; onFile: (f: File) => void; onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [preview, setPreview] = useState("")
  const id = `id-${side}`
  const errId = `${id}-error`
  useEffect(() => {
    if (file && file.type.startsWith("image/")) { const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u) }
    setPreview("")
  }, [file])
  const pick = (list: FileList | null) => { const f = list?.[0]; if (f) onFile(f) }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files) }
  const pill = "inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold leading-tight focus-visible:outline-2 focus-visible:outline-offset-2"
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-slate-800">
        {label}{optional ? <span className="font-normal text-slate-500"> (optional)</span> : <span aria-hidden className="text-[#3B2BBF]"> *</span>}
        <Ar text={AR[label] && (optional ? `${AR[label]} ${AR["(optional)"]}` : AR[label])} />
      </p>
      <input ref={inputRef} id={id} name={id} type="file" accept={ID_ACCEPT} className="sr-only"
        aria-describedby={error ? errId : `${id}-hint`} aria-invalid={error ? true : undefined} aria-label={`Upload ID ${side}${optional ? " (optional)" : ""}`}
        onChange={(e) => { pick(e.target.files); e.target.value = "" }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { pick(e.target.files); e.target.value = "" }} />
      {file ? (
        <div data-testid={`${id}-preview`} className="overflow-hidden rounded-2xl border border-[#3B2BBF]/25 bg-[linear-gradient(180deg,#F8F7FF,#F1EEFF)] p-3">
          <div className="relative mx-auto aspect-[1.586] w-full overflow-hidden rounded-xl bg-white shadow-[0_14px_30px_-18px_rgba(59,43,191,.8)] ring-1 ring-[#3B2BBF]/15">
            {preview
              ? <img src={preview} alt={`Preview of ID ${side}`} className="h-full w-full object-cover" />
              : <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#3B2BBF]"><FileText aria-hidden className="h-9 w-9" /><span className="text-xs font-semibold">PDF</span></span>}
            <span aria-hidden className="id-scan pointer-events-none absolute inset-x-0 top-0 h-full" />
            <span aria-hidden className="pointer-events-none absolute inset-2 rounded-lg border border-white/70" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-xs text-slate-600"><span className="block max-w-[14rem] truncate font-semibold text-slate-900">{file.name}</span>{kb(file.size)} · <span className="font-semibold text-emerald-700">Ready to send</span><Ar en="Ready to send" /></p>
            <div className="flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className={`${pill} border-slate-300 text-slate-700 hover:border-[#3B2BBF] hover:text-[#3B2BBF] focus-visible:outline-[#3B2BBF]`}><RefreshCw aria-hidden className="h-3.5 w-3.5" /> Replace</button>
              <button type="button" onClick={onRemove} className={`${pill} border-rose-200 text-rose-700 hover:bg-rose-50 focus-visible:outline-rose-500`}><Trash2 aria-hidden className="h-3.5 w-3.5" /> Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${error ? "border-rose-400 bg-rose-50/60" : over ? "border-[#3B2BBF] bg-[#3B2BBF]/[.06]" : "border-[#3B2BBF]/25 bg-white hover:border-[#3B2BBF]/55"}`}>
          <CardOutline passport={passport && side === "front"} />
          <p className="mt-3 text-sm text-slate-600">
            <span className="hidden sm:inline">Drag &amp; drop, or </span>
            <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-[#3B2BBF] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">choose a file</button>
            <Ar en="Drag & drop, or choose a file" className="hidden text-center sm:block" />
            <Ar en="choose a file" className="text-center sm:hidden" />
          </p>
          <button type="button" onClick={() => camRef.current?.click()} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3B2BBF] px-4 py-2 text-xs font-semibold text-white sm:hidden">
            <Camera aria-hidden className="h-4 w-4" /> <span className="leading-tight">Take a photo<Ar en="Take a photo" className="text-center !text-white/85" /></span>
          </button>
          <p id={`${id}-hint`} className="mt-2 text-xs text-slate-500">JPG, PNG or PDF · max 5 MB</p>
        </div>
      )}
      {error && <p id={errId} role="alert" className="mt-2 text-xs font-medium text-rose-700">{error}<Ar en={error} className="!text-rose-700/80" /></p>}
    </div>
  )
}

export function IdDropzones({ idType, files, errors, setFile }: { idType: string; files: IdFiles; errors: Partial<Record<IdSide, string>>; setFile: (s: IdSide, f?: File) => void }) {
  const passport = idType === "Passport"
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Zone side="front" passport={passport} label={passport ? "Passport photo page" : "Front of ID"} file={files.front} error={errors.front} onFile={(f) => setFile("front", f)} onRemove={() => setFile("front")} />
      <Zone side="back" passport={passport} label="Back of ID" optional={passport} file={files.back} error={errors.back} onFile={(f) => setFile("back", f)} onRemove={() => setFile("back")} />
    </div>
  )
}

export function PrivacyNoteV2() {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl border border-[#3B2BBF]/15 bg-[#3B2BBF]/[.04] px-4 py-3 text-xs leading-relaxed text-slate-600">
      <Lock aria-hidden className="mt-0.5 h-4 w-4 flex-none text-[#3B2BBF]" />
      <span><strong className="text-slate-800">Privacy:</strong> your ID is sent over an encrypted connection only to our team, and only when you submit. It is not stored on this website.
        <Ar en="Privacy: your ID is sent over an encrypted connection only to our team, and only when you submit. It is not stored on this website." className="mt-1" /></span>
    </p>
  )
}
