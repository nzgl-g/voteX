
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CountdownTimerProps = {
    endTime: Date;
    className?: string;
};

const CountdownTimer = ({ endTime, className }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState<string>("00:00:00");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = endTime.getTime() - new Date().getTime();

            if (difference <= 0) {
                setTimeLeft("00:00:00");
                return;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            );
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    return (
        <div className={cn("font-mono text-2xl font-semibold", className)}>
            {timeLeft}
        </div>
    );
};

export default CountdownTimer;