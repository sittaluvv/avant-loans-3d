/** Loan types shared by the homepage cards, the picker modal and the apply form (?type=<slug>). */
import houseImg from "../assets/3d/fluent-house.webp"
import carImg from "../assets/3d/fluent-car.webp"
import moneyBagImg from "../assets/3d/fluent-money-bag.webp"
import briefcaseImg from "../assets/3d/fluent-briefcase.webp"
import gradCapImg from "../assets/3d/fluent-grad-cap.webp"

export const LOAN_TYPE_LIST = [
  { slug: "personal", id: "Personal", label: "Personal Loan", hint: "Flexible use of funds", img: moneyBagImg },
  { slug: "auto", id: "Auto/Car", label: "Auto Loan", hint: "Finance a vehicle", img: carImg },
  { slug: "mortgage", id: "Mortgage", label: "Mortgage", hint: "Buy or refinance a home", img: houseImg },
  { slug: "business", id: "Business", label: "Business Loan", hint: "Grow or start a company", img: briefcaseImg },
  { slug: "education", id: "Education", label: "Education Loan", hint: "School or training costs", img: gradCapImg },
] as const

export const loanTypeBySlug = (slug?: string | null) => LOAN_TYPE_LIST.find((t) => t.slug === (slug || "").trim().toLowerCase())
export const loanTypeById = (id?: string) => LOAN_TYPE_LIST.find((t) => t.id === id)
export const applyUrlFor = (applyUrl: string, slug: string) => `${applyUrl}?type=${encodeURIComponent(slug)}`

/* Tiny global opener so any generic "Apply" button can open the picker. */
export const OPEN_PICKER_EVENT = "avant:open-loan-picker"
export function openLoanPicker() { window.dispatchEvent(new Event(OPEN_PICKER_EVENT)) }
