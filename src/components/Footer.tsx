import { Logo } from "./Logo"
export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo className="h-12" />
          <p className="mt-4 max-w-sm text-sm text-mist">Simple, fast, and transparent personal loans. A design concept.</p>
        </div>
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[.03] p-5 text-sm leading-relaxed text-mist">
          <p className="font-semibold text-frost">Important: this is a demo website.</p>
          <p className="mt-2">Avant Loans Middle East is not a real lender and is not affiliated with any real lender or financial institution. No loans, mortgages, credit or financial products are offered here. The application form is for demonstration only. It does not send, store or share any data, and submitting it does not create an application.</p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-mist/70">© 2026 Avant Loans Middle East. Demo site. Not affiliated with any real lender.</p>
    </footer>
  )
}
