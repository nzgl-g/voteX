import { Badge } from "@/components/shadcn-ui/badge";
import { Button } from "@/components/shadcn-ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/shadcn-ui/card";
import { cn } from "@/lib/utils";
import { UserPlus, Vote, FileText, Calendar } from "lucide-react";

type SessionStatus = "nomination" | "started" | "ended" | "upcoming";

interface SessionCardProps {
    title: string;
    description: string;
    bannerUrl: string;
    status: SessionStatus;
    onViewSession: () => void;
    onJoinAsCandidate?: () => void;
    onVote?: () => void;
    onShowResults?: () => void;
    onSecretPhraseConfirmed?: (phrase: string) => void;
}

export function SessionCard({
                                title,
                                description,
                                bannerUrl,
                                status,
                                onViewSession,
                                onJoinAsCandidate,
                                onVote,
                                onShowResults,
                                onSecretPhraseConfirmed,
                            }: SessionCardProps) {
    const statusColors: Record<SessionStatus, string> = {
        nomination: "bg-amber-500 hover:bg-amber-600",
        started: "bg-green-500 hover:bg-green-600",
        ended: "bg-gray-500 hover:bg-gray-600",
        upcoming: "bg-blue-500 hover:bg-blue-600",
    };

    const statusDisplay: Record<SessionStatus, string> = {
        nomination: "Nomination",
        started: "In Progress",
        ended: "Ended",
        upcoming: "Upcoming",
    };

    const renderActionButton = () => {
        switch (status) {
            case "nomination":
                return (
                    <Button
                        variant="secondary"
                        onClick={onJoinAsCandidate}
                        className="flex-1"
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join as Candidate
                    </Button>
                );
            case "started":
                return (
                    <Button
                        variant="secondary"
                        onClick={onVote}
                        className="flex-1"
                    >
                        <Vote className="mr-2 h-4 w-4" />
                        Vote
                    </Button>
                );
            case "ended":
                return (
                    <Button
                        variant="secondary"
                        onClick={onShowResults}
                        className="flex-1"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Show Results
                    </Button>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="overflow-hidden flex flex-col h-full transition-transform hover:shadow-lg hover:scale-[1.01]">
            <div className="relative h-40 w-full overflow-hidden">
                <img
                    src={bannerUrl}
                    alt={`${title} banner`}
                    className="w-full h-full object-cover"
                />
                <Badge
                    className={cn("absolute top-3 right-3", statusColors[status])}
                >
                    {statusDisplay[status]}
                </Badge>
            </div>
            <CardHeader className="pb-2">
                <h3 className="text-xl font-bold">{title}</h3>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">{description}</p>
            </CardContent>
            <CardFooter className="border-t pt-4 gap-2 flex">
                <Button
                    className="flex-1"
                    onClick={onViewSession}
                >
                    View Session
                </Button>
                {renderActionButton()}
            </CardFooter>
        </Card>
    );
}
