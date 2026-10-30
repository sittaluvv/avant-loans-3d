import { useEffect, useRef, useState } from "react"
import { MessageCircle, Send, X } from "lucide-react"
import { CONTACT } from "../config/contact"
import { isAr, tr } from "../i18n/lang"
import { APPLY_URL } from "../components/Header"
import { ILLUSTRATIVE } from "../components/LoanInfo"

/**
 * Avant assistant: a small on-device FAQ bot (no AI, no network, nothing stored or sent).
 * Answers only from published site content; hands off to Apply, WhatsApp or email.
 */
type Link = { label: string; href: string }
type Msg = { from: "bot" | "me"; text: string; links?: Link[] }
type Bi = [string, string]
const WA = `https://wa.me/${CONTACT.phone.replace(/\D/g, "")}`
const L = (en: string, ar: string) => (isAr() ? ar : en)
const apply = (): Link => ({ label: L("Start application", "ابدأ الطلب"), href: APPLY_URL })
const human = (): Link[] => [{ label: L("WhatsApp our team", "واتساب فريقنا"), href: WA }, { label: L("Email apply@", "راسل apply@"), href: `mailto:${CONTACT.email}` }]

const INTENTS: { id: string; chip?: Bi; keys: RegExp; a: Bi; links?: () => Link[] }[] = [
  { id: "types", chip: ["Loan types", "أنواع القروض"], keys: /type|kind|product|mortgage|auto|car|business|education|personal|نوع|انواع|أنواع|عقار|سيار|تعليم|أعمال|شخصي/i,
    a: ["We take enquiries for five loans: Personal, Auto, Mortgage, Business and Education — all through one short application.", "نستقبل استفسارات لخمسة أنواع: شخصي، سيارات، تمويل عقاري، أعمال، وتعليم — جميعها عبر طلب واحد قصير."], links: () => [apply()] },
  { id: "elig", chip: ["Who can apply?", "من يمكنه التقديم؟"], keys: /eligib|qualif|who can|age|resident|income|salary|اهل|أهل|شروط|عمر|مقيم|دخل|راتب|يمكنه/i,
    a: ["Typical requirements: age 21–60, UAE or GCC resident with a valid ID, regular monthly income (salaried or self-employed), and an active mobile number and email. Our team confirms the exact requirements for your enquiry.", "المتطلبات العامة: العمر من 21 إلى 60 سنة، مقيم في الإمارات أو دول الخليج بهوية سارية، دخل شهري منتظم (موظف أو عمل حر)، ورقم جوال وبريد إلكتروني فعّالان. يؤكد فريقنا المتطلبات الدقيقة لاستفسارك."], links: () => [apply()] },
  { id: "docs", chip: ["Documents", "المستندات"], keys: /doc|paper|statement|payslip|passport|emirates id|proof|مستند|وثائق|كشف|جواز|هوية|إثبات/i,
    a: ["Keep these ready: Emirates ID or national ID / passport, latest salary certificate or payslip, last 3 months' bank statements, and proof of address. The online form only asks for your ID; the team will tell you if anything else is needed.", "جهّز ما يلي: الهوية الإماراتية أو الهوية الوطنية / جواز السفر، أحدث شهادة راتب أو قسيمة راتب، كشوف حساب لآخر 3 أشهر، وإثبات العنوان. النموذج الإلكتروني يطلب الهوية فقط، وسيخبرك الفريق إن احتجت شيئًا آخر."] },
  { id: "calc", chip: ["Calculator & rates", "الحاسبة والأسعار"], keys: /calc|rate|apr|interest|fee|monthly|cost|instal|حاسب|فائد|سعر|نسبة|رسوم|قسط|تكلف/i,
    a: [`The calculator uses illustrative figures only: ${ILLUSTRATIVE.aprPct}% APR (reducing balance) and a ${ILLUSTRATIVE.processingFeePct}% one-time processing fee. It is not a loan offer — your actual rate, fees and approval depend on review.`, `الحاسبة تستخدم أرقامًا توضيحية فقط: ${ILLUSTRATIVE.aprPct}% معدل سنوي (رصيد متناقص) و${ILLUSTRATIVE.processingFeePct}% رسوم معالجة لمرة واحدة. هذا ليس عرض قرض — يعتمد السعر الفعلي والرسوم والموافقة على المراجعة.`], links: () => [{ label: L("Open calculator", "افتح الحاسبة"), href: "/#calculator" }] },
  { id: "how", chip: ["How it works", "كيف يعمل"], keys: /how|step|process|long|time|minute|apply|start|كيف|خطو|مدة|وقت|قدم|أقدم|ابدأ/i,
    a: ["Three short steps, about 5 minutes: choose a loan, tell us about you (and pick WhatsApp or email), then our team reviews your enquiry and contacts you. Submitting is an enquiry, not an approval.", "ثلاث خطوات قصيرة في حوالي 5 دقائق: اختر القرض، أخبرنا عنك (واختر واتساب أو البريد)، ثم يراجع فريقنا استفسارك ويتواصل معك. الإرسال استفسار وليس موافقة."], links: () => [apply()] },
  { id: "safe", chip: ["Is it safe?", "هل هو آمن؟"], keys: /safe|scam|fraud|otp|pin|secure|upfront|trust|آمن|احتيال|رمز|مقدم|ثقة/i,
    a: ["Avant never asks for an upfront fee, OTP or card PIN to process an enquiry. Your ID is sent over an encrypted connection only to our team. Only trust contact from +971 50 179 3501 or apply@avant-middle-east.com.", "لا تطلب Avant أبدًا رسومًا مقدمة أو رمز تحقق أو رقم PIN لمعالجة أي استفسار. تُرسل هويتك عبر اتصال مشفّر إلى فريقنا فقط. لا تثق إلا بالتواصل من ‎+971 50 179 3501‎ أو apply@avant-middle-east.com."] },
  { id: "contact", chip: ["Talk to a person", "تحدث مع موظف"], keys: /contact|human|person|agent|call|phone|whatsapp|email|office|where|address|meydan|تواصل|موظف|اتصال|هاتف|واتساب|بريد|مكتب|عنوان|ميدان/i,
    a: [`Our team is at ${CONTACT.address}. Reach us on WhatsApp or by phone at ${CONTACT.phoneDisplay}, or email ${CONTACT.email}.`, `فريقنا في ميدان جراندستاند، الطابق 6، شارع الميدان، ند الشبا 1، دبي. تواصل معنا عبر واتساب أو الهاتف ‎${CONTACT.phoneDisplay}‎ أو البريد ${CONTACT.email}.`], links: human },
  { id: "approve", keys: /approv|guarant|chance|credit score|reject|موافق|مضمون|رفض|ائتمان/i,
    a: ["I can't say whether an enquiry will be approved — every application is reviewed by our team, and submitting is not a loan offer or approval.", "لا يمكنني تحديد ما إذا كان الطلب سيُوافق عليه — يراجع فريقنا كل طلب، والإرسال ليس عرض قرض أو موافقة."], links: () => [apply(), ...human()] },
]
const HELLO: Bi = ["Hi, I'm the Avant assistant. I can help with loan types, who can apply, documents and the calculator. What would you like to know?", "مرحبًا، أنا مساعد Avant. يمكنني مساعدتك في أنواع القروض وشروط التقديم والمستندات والحاسبة. بماذا أساعدك؟"]
const FALLBACK: Bi = ["I'm not sure about that one. Our team can help directly — or try one of the topics below.", "لست متأكدًا من ذلك. يمكن لفريقنا مساعدتك مباشرة — أو جرّب أحد المواضيع أدناه."]

function answer(q: string): Msg {
  const hit = INTENTS.find((i) => i.keys.test(q))
  const ar = isAr()
  if (!hit) return { from: "bot", text: FALLBACK[ar ? 1 : 0], links: human() }
  return { from: "bot", text: hit.a[ar ? 1 : 0], links: hit.links?.() }
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ from: "bot", text: HELLO[isAr() ? 1 : 0] }])
  const [q, setQ] = useState("")
  const [shown, setShown] = useState(false)
  useEffect(() => { const f = () => setShown(scrollY > 360); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f) }, [])
  const list = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), btn = useRef<HTMLButtonElement>(null)
  useEffect(() => { list.current?.scrollTo({ top: 1e6, behavior: "smooth" }) }, [msgs, open])
  useEffect(() => {
    if (!open) return
    setTimeout(() => input.current?.focus({ preventScroll: true }), 250)
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus() } }
    addEventListener("keydown", k); return () => removeEventListener("keydown", k)
  }, [open])
  const ask = (text: string) => { const t = text.trim(); if (!t) return; setMsgs((m) => [...m, { from: "me", text: t }, answer(t)]); setQ("") }
  const ar = isAr()
  return (
    <div data-no-i18n data-testid="chat">
      <button ref={btn} type="button" onClick={() => setOpen(true)} aria-label={tr("Ask Avant")} data-testid="chat-open"
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] z-[55] inline-flex h-12 items-center gap-2 rounded-full bg-[#1a1446]/90 ps-4 pe-5 text-sm font-semibold text-white shadow-[0_16px_40px_-12px_rgba(26,20,70,.8)] ring-1 ring-white/15 backdrop-blur-xl transition-all hover:bg-[#3B2BBF] end-4 sm:end-6 ${open || !shown ? "pointer-events-none translate-y-4 scale-90 opacity-0" : ""}`}>
        <MessageCircle aria-hidden className="h-5 w-5" />{tr("Ask Avant")}
      </button>
      {open && <div className="fixed inset-0 z-[59] bg-[#120d33]/30 backdrop-blur-[2px] sm:hidden" onClick={() => setOpen(false)} />}
      <section role="dialog" aria-modal="false" aria-label={tr("Avant assistant")} hidden={!open}
        className="chat-sheet fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(82svh,640px)] flex-col rounded-t-[28px] border border-[#3B2BBF]/10 bg-white/95 shadow-[0_-20px_60px_-20px_rgba(26,20,70,.5)] backdrop-blur-xl sm:inset-x-auto sm:end-6 sm:bottom-6 sm:w-[380px] sm:rounded-[28px]">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 pt-3 pb-3">
          <span aria-hidden className="mx-auto mb-1 block h-1 w-9 rounded-full bg-slate-300 sm:hidden absolute top-2 inset-x-0" />
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#6B5BFF] to-[#2A1D9E] text-sm font-bold text-white">A</span>
          <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{tr("Avant assistant")}</p><p className="text-xs text-slate-500">{tr("Quick answers · not a loan offer")}</p></div>
          <button type="button" onClick={() => { setOpen(false); btn.current?.focus() }} aria-label={tr("Close chat")} className="grid h-11 w-11 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><X aria-hidden className="h-5 w-5" /></button>
        </header>
        <div ref={list} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}>
              <p className={`max-w-[85%] rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed ${m.from === "me" ? "bg-[#3B2BBF] text-white" : "bg-[#F3F0FF] text-slate-800"}`}>{m.text}</p>
              {m.links && <div className="mt-2 flex flex-wrap gap-2">{m.links.map((l) => (
                <a key={l.href} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-[#3B2BBF]/25 px-4 text-sm font-semibold text-[#3B2BBF] hover:bg-[#3B2BBF]/5">{l.label}</a>))}</div>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {INTENTS.filter((i) => i.chip).map((i) => (
            <button key={i.id} type="button" onClick={() => ask(i.chip![ar ? 1 : 0])} className="min-h-9 flex-none rounded-full bg-slate-100 px-3.5 text-sm font-medium text-slate-700 hover:bg-[#3B2BBF]/10">{i.chip![ar ? 1 : 0]}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(q) }} className="flex items-center gap-2 border-t border-slate-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Type a question…")} aria-label={tr("Type a question…")} maxLength={200}
            className="min-h-11 min-w-0 flex-1 rounded-full bg-slate-100 px-4 text-[16px] outline-none focus:ring-2 focus:ring-[#3B2BBF]/40" />
          <button type="submit" aria-label={tr("Send")} className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#3B2BBF] text-white disabled:opacity-40" disabled={!q.trim()}><Send aria-hidden className="h-5 w-5 rtl-flip" /></button>
        </form>
      </section>
    </div>
  )
}
