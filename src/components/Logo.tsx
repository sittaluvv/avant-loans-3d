import logoSvg from "../assets/logo.svg"
import logoPng from "../assets/logo.png"

/* Refined flat wordmark (Option 1). SVG for crispness, 2x PNG fallback. */
export function Logo({ className = "" }: { className?: string; onDark?: boolean }) {
  return (
    <picture>
      <source srcSet={logoSvg} type="image/svg+xml" />
      <img
        src={logoPng}
        alt="Avant Loans Middle East"
        width={467}
        height={148}
        decoding="async"
        className={`w-auto select-none ${className}`}
      />
    </picture>
  )
}
