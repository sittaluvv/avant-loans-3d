/*
 * SAMPLE reviews for the demo site. These are NOT real customers.
 * Replace this array with genuine, consented customer feedback before any real launch.
 */
export type LoanKind = "Mortgage" | "Personal" | "Auto" | "Business" | "Education"

export interface Review {
  name: string // first name + last initial
  city: string
  loan: LoanKind
  rating: 1 | 2 | 3 | 4 | 5
  quote: string
}

export const REVIEWS_ARE_SAMPLES = true

export const reviews: Review[] = [
  {
    name: "Layla H.",
    city: "Dubai",
    loan: "Mortgage",
    rating: 5,
    quote: "The steps were clear from the start, and I always knew what came next. No surprises in the paperwork.",
  },
  {
    name: "Omar K.",
    city: "Riyadh",
    loan: "Auto",
    rating: 5,
    quote: "I filled in the form on my phone during lunch. Choosing the amount and term with the slider made it easy.",
  },
  {
    name: "Fatima A.",
    city: "Abu Dhabi",
    loan: "Personal",
    rating: 5,
    quote: "Simple questions, plain language and a quick follow-up. Exactly what I wanted for a small personal loan.",
  },
  {
    name: "Yousef M.",
    city: "Doha",
    loan: "Business",
    rating: 5,
    quote: "As a shop owner I don't have time for long forms. This took a few minutes and the team called back the same day.",
  },
  {
    name: "Noor S.",
    city: "Kuwait City",
    loan: "Education",
    rating: 5,
    quote: "Applying for my master's tuition felt straightforward. I liked seeing a summary before submitting.",
  },
  {
    name: "Khalid R.",
    city: "Manama",
    loan: "Personal",
    rating: 5,
    quote: "Friendly, transparent and fast. The repayment options were explained without any jargon.",
  },
]
