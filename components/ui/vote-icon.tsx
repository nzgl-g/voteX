import type { LucideProps } from "lucide-react"

export function VoteIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 3v4c0 2-2 4-4 4H2" />
      <path d="M18 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      <path d="m2 7 5 5" />
      <path d="M6 7H2v4" />
    </svg>
  )
}
