import logoWebp from "../assets/logo.webp"
import logoPng from "../assets/logo.png"

export function Logo({ className = "", onDark = true }: { className?: string; onDark?: boolean }) {
  return (
    <picture>
      <source srcSet={logoWebp} type="image/webp" />
      <img
        src={logoPng}
        alt="Avant Loans Middle East"
        width={574}
        height={220}
        className={`w-auto ${onDark ? "logo-on-dark" : ""} ${className}`}
      />
    </picture>
  )
}
