
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card";
import { cn } from "@/lib/utils";
import { LockIcon } from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn-ui/tooltip";

interface LockedFeatureCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  tooltipMessage?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function LockedFeatureCard({
  title,
  description,
  icon,
  className,
  tooltipMessage = "Upgrade to Pro to unlock this feature",
  onClick,
}: LockedFeatureCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn("relative overflow-hidden opacity-50 transition-all", className)}>
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <LockIcon className="h-10 w-10 text-muted-foreground/70" />
            </div>
            <CardHeader>
              {icon && <div className="mb-2">{icon}</div>}
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="text-muted-foreground/70">
              This feature is locked
            </CardContent>
            {onClick && (
              <CardFooter>
                <Button variant="outline" onClick={onClick} className="w-full">
                  Upgrade
                </Button>
              </CardFooter>
            )}
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
