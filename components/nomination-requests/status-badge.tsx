import { Badge } from "@/components/ui/badge"
import { cva } from "class-variance-authority"
import { type VariantProps } from "class-variance-authority"

const statusVariants = cva("", {
  variants: {
    status: {
      approved: "bg-green-500 hover:bg-green-600",
      pending: "bg-amber-500 hover:bg-amber-600",
      declined: "bg-red-500 hover:bg-red-600",
      rejected: "bg-red-500 hover:bg-red-600",
    },
  },
  defaultVariants: {
    status: "pending",
  },
})

interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  status: "approved" | "pending" | "declined" | "rejected";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusText = {
    approved: "Approved",
    pending: "Pending",
    declined: "Declined",
    rejected: "Rejected",
  }

  return <Badge className={statusVariants({ status })}>{statusText[status]}</Badge>
}
