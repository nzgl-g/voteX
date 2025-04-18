import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
    status: "live" | "ended";
    className?: string;
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
    return (
        <div
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                status === "live"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                className
            )}
        >
            {status === "live" ? (
                <Check className="mr-1 h-3 w-3" />
            ) : (
                <X className="mr-1 h-3 w-3" />
            )}
            {status === "live" ? "Live" : "Ended"}
        </div>
    );
};

export default StatusBadge;