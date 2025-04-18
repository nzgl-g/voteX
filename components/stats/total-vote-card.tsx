
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/shadcn-ui/card";
import StatusBadge from "@/components/status-badge";
import UpdateTime from "@/components/update-time";

type TotalVotesCardProps = {
    initialVotes?: number;
    sessionStatus: "live" | "ended";
};

const TotalVotesCard = ({
                            initialVotes = 1234,
                            sessionStatus
                        }: TotalVotesCardProps) => {
    const [totalVotes, setTotalVotes] = useState<number>(initialVotes);
    const [updateTime, setUpdateTime] = useState<string>(
        new Date().toLocaleTimeString()
    );

    useEffect(() => {
        // In a real app, this would fetch vote data from an API
        // For demo purposes, we'll just update randomly every 5 seconds
        if (sessionStatus === "live") {
            const interval = setInterval(() => {
                // Add a random number of votes (0-10)
                const newVotes = totalVotes + Math.floor(Math.random() * 10);
                setTotalVotes(newVotes);
                setUpdateTime(new Date().toLocaleTimeString());
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [totalVotes, sessionStatus]);

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <h3 className="font-semibold text-lg">Total Votes</h3>
                <StatusBadge status={sessionStatus} />
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-muted-foreground mb-2">Total votes</p>
                    <div className="text-4xl font-bold">{totalVotes.toLocaleString()}</div>
                </div>
            </CardContent>
            <CardFooter className="pt-2 border-t">
                <UpdateTime time={updateTime} />
            </CardFooter>
        </Card>
    );
};

export default TotalVotesCard;
