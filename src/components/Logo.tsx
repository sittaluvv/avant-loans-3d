import logoSvg from "../assets/logo.svg"
import logoWhiteSvg from "../assets/logo-white.svg"
import logoPng from "../assets/logo.png"

/* Refined flat wordmark (Option 1). SVG for crispness, 2x PNG fallback.
 * variant="white" is the reversed version for use over the dark hero video. */
export function Logo({ className = "", variant = "color" }: { className?: string; onDark?: boolean; variant?: "color" | "white" }) {
  if (variant === "white") {
    return <img src={logoWhiteSvg} alt="Avant Loans Middle East" width={467} height={148} decoding="async" className={`w-auto select-none ${className}`} />
  }
  return (
    <picture>
      <source srcSet={logoSvg} type="image/svg+xml" />
      <img src={logoPng} alt="Avant Loans Middle East" width={467} height={148} decoding="async" className={`w-auto select-none ${className}`} />
    </picture>
  )
}
