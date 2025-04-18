
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function FeatureCard({
  title,
  description,
  icon,
  selected = false,
  className,
  onClick,
  children,
}: FeatureCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all hover:border-primary cursor-pointer", 
        selected && "border-primary ring-1 ring-primary",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        {icon && <div className="mb-2">{icon}</div>}
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
