import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ProFeatureBadgeProps {
  className?: string
}

export function ProFeatureBadge({ className }: ProFeatureBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "absolute top-2 right-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
              className,
            )}
          >
            PRO
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This feature requires a PRO subscription</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
