
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn-ui/tooltip";

interface InfoTooltipProps {
  text: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function InfoTooltip({ text, side = "top", className }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <InfoIcon className={`h-4 w-4 text-muted-foreground inline-block ml-1 cursor-help ${className}`} />
        </TooltipTrigger>
        <TooltipContent side={side} align="center" className="max-w-xs text-sm">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
