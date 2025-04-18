import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type UpdateTimeProps = {
    time: string;
    className?: string;
};

const UpdateTime = ({ time, className }: UpdateTimeProps) => {
    return (
        <div className={cn("flex items-center text-xs text-muted-foreground", className)}>
            <Clock className="mr-1 h-3 w-3" />
            <span>Latest update: {time}</span>
        </div>
    );
};

export default UpdateTime;
