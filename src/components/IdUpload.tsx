import { useEffect, useRef, useState, type DragEvent } from "react"
import { Camera, FileText, Lock, RefreshCw, Trash2, UploadCloud } from "lucide-react"
import { Ar } from "../i18n/Ar"
import { AR } from "../i18n/ar"

export const ID_TYPES = ["Passport", "Resident card (Emirates ID / Iqama / residence permit)", "National ID"] as const
export const MAX_ID_BYTES = 5 * 1024 * 1024
export const ID_ACCEPT = "image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
const OK_TYPES = ["image/jpeg", "image/png", "application/pdf"]

export type IdFiles = { front?: File; back?: File }
export type IdSide = keyof IdFiles

/** Client-side check (the Worker re-checks type, magic bytes and size). */
export function checkIdFile(f: File): string | null {
  const ext = f.name.split(".").pop()?.toLowerCase() || ""
  const typeOk = OK_TYPES.includes(f.type) || (!f.type && ["jpg", "jpeg", "png", "pdf"].includes(ext))
  if (!typeOk) return "Please upload a JPG, PNG or PDF file."
  if (f.size > MAX_ID_BYTES) return `This file is ${(f.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`
  if (f.size === 0) return "This file is empty."
  return null
}

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

function DropZone({ side, label, optional, file, error, onFile, onRemove }: {
  side: IdSide; label: string; optional?: boolean; file?: File; error?: string
  onFile: (f: File) => void; onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [preview, setPreview] = useState<string>("")
  const id = `id-${side}`

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file); setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreview("")
  }, [file])

  const pick = (list: FileList | null) => { const f = list?.[0]; if (f) onFile(f) }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files) }
  const errId = `${id}-error`

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">
        {label}{optional ? <span className="font-normal text-slate-500"> (optional)</span> : <span aria-hidden className="text-[#3B2BBF]"> *</span>}
        <Ar text={AR[label] && (optional ? `${AR[label]} ${AR["(optional)"]}` : AR[label])} />
      </p>
      <input ref={inputRef} id={id} name={id} type="file" accept={ID_ACCEPT} className="sr-only"
        aria-describedby={error ? errId : `${id}-hint`} aria-invalid={error ? true : undefined}
        aria-label={`Upload ID ${side}${optional ? " (optional)" : ""}`}
        onChange={(e) => { pick(e.target.files); e.target.value = "" }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden
        onChange={(e) => { pick(e.target.files); e.target.value = "" }} />

      {file ? (
        <div data-testid={`${id}-preview`} className="flex items-center gap-4 rounded-2xl border border-[#3B2BBF]/25 bg-[#3B2BBF]/[.04] p-3">
          {preview
            ? <img src={preview} alt={`Preview of ID ${side}`} className="h-20 w-28 flex-none rounded-xl border border-white object-cover shadow-sm" />
            : <span className="flex h-20 w-28 flex-none items-center justify-center rounded-xl bg-white text-[#3B2BBF] shadow-sm"><FileText aria-hidden className="h-8 w-8" /></span>}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{kb(file.size)} · ready to send</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#3B2BBF] hover:text-[#3B2BBF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
                <RefreshCw aria-hidden className="h-3.5 w-3.5" /> Replace
              </button>
              <button type="button" onClick={onRemove}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
                <Trash2 aria-hidden className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${error ? "border-rose-400 bg-rose-50/60" : over ? "border-[#3B2BBF] bg-[#3B2BBF]/[.06]" : "border-slate-300 bg-white hover:border-[#3B2BBF]/50"}`}>
          <UploadCloud aria-hidden className="mx-auto h-8 w-8 text-[#3B2BBF]" />
          <p className="mt-2 text-sm text-slate-600">
            <span className="hidden sm:inline">Drag &amp; drop, or </span>
            <button type="button" onClick={() => inputRef.current?.click()}
              className="font-semibold text-[#3B2BBF] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
              choose a file
            </button>
            <Ar en="Drag & drop, or choose a file" className="hidden text-center sm:block" />
            <Ar en="choose a file" className="text-center sm:hidden" />
          </p>
          <button type="button" onClick={() => camRef.current?.click()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3B2BBF] px-4 py-2 text-xs font-semibold text-white sm:hidden">
            <Camera aria-hidden className="h-4 w-4" /> <span className="leading-tight">Take a photo<Ar en="Take a photo" className="text-center !text-white/85" /></span>
          </button>
          <p id={`${id}-hint`} className="mt-2 text-xs text-slate-500">JPG, PNG or PDF · max 5 MB</p>
        </div>
      )}
      {error && <p id={errId} role="alert" className="mt-2 text-xs font-medium text-rose-700">{error}<Ar en={error} className="!text-rose-700/80" /></p>}
    </div>
  )
}

export function IdPrivacyNote() {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-[#3B2BBF]/15 bg-[#3B2BBF]/[.04] px-3 py-2.5 text-xs leading-relaxed text-slate-600">
      <Lock aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-[#3B2BBF]" />
      <span>
        <strong className="text-slate-800">Privacy:</strong> your ID is sent over an encrypted connection only to our team, and only when you submit.
        It is not stored on this website.
        <Ar en="Privacy: your ID is sent over an encrypted connection only to our team, and only when you submit. It is not stored on this website." className="mt-1" />
      </span>
    </p>
  )
}

export function IdUploads({ idType, files, errors, setFile }: {
  idType: string; files: IdFiles; errors: Partial<Record<IdSide, string>>
  setFile: (side: IdSide, f?: File) => void
}) {
  const passport = idType === "Passport"
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DropZone side="front" label={passport ? "Passport photo page" : "Front of ID"} file={files.front} error={errors.front}
        onFile={(f) => setFile("front", f)} onRemove={() => setFile("front")} />
      <DropZone side="back" label="Back of ID" optional={passport} file={files.back} error={errors.back}
        onFile={(f) => setFile("back", f)} onRemove={() => setFile("back")} />
    </div>
  )
}
