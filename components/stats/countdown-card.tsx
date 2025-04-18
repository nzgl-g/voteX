import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/shadcn-ui/card";
import StatusBadge from "@/components/status-badge";
import UpdateTime from "@/components/update-time";
import CountdownTimer from "@/components/countdown-timer";

type CountdownCardProps = {
    sessionStatus: "live" | "ended";
    initialEndTime?: Date;
};

const CountdownCard = ({
                           sessionStatus,
                           initialEndTime
                       }: CountdownCardProps) => {
    // Set default end time to 1 hour from now if not provided
    const [sessionEndTime] = useState<Date>(() => {
        if (initialEndTime) return initialEndTime;

        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 1);
        return endTime;
    });

    const [updateTime, setUpdateTime] = useState<string>(
        new Date().toLocaleTimeString()
    );

    useEffect(() => {
        // Update the time display every second
        const timer = setInterval(() => {
            setUpdateTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <h3 className="font-semibold text-lg">Vote Session Countdown</h3>
                <StatusBadge status={sessionStatus} />
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-6">
                    <CountdownTimer endTime={sessionEndTime} />
                    <p className="text-muted-foreground mt-2">Time remaining</p>
                </div>
            </CardContent>
            <CardFooter className="pt-2 border-t">
                <UpdateTime time={updateTime} />
            </CardFooter>
        </Card>
    );
};

export default CountdownCard;
