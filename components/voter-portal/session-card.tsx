"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/shadcn-ui/card";
import { Button } from "@/components/shadcn-ui/button";
import { Badge } from "@/components/shadcn-ui/badge";
import { Eye, Award, Vote as VoteIcon, ChartBar, Calendar } from "lucide-react";

interface SessionCardProps {
    title: string;
    description: string;
    bannerUrl: string;
    status: "nomination" | "started" | "ended" | "upcoming";
    hasAppliedAsCandidate?: boolean;
    onViewSession: () => void;
    onJoinAsCandidate?: () => void;
    onVote?: () => void;
    onShowResults?: () => void;
}

const statusConfig = {
    nomination: {
        colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        label: "Nomination Phase",
        accentClass: "border-blue-500 dark:border-blue-400"
    },
    started: {
        colorClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        label: "Voting Active",
        accentClass: "border-green-500 dark:border-green-400"
    },
    ended: {
        colorClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        label: "Session Ended",
        accentClass: "border-gray-500 dark:border-gray-400"
    },
    upcoming: {
        colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        label: "Upcoming",
        accentClass: "border-purple-500 dark:border-purple-400"
    },
};

export function SessionCard({
                                title,
                                description,
                                bannerUrl,
                                status,
                                hasAppliedAsCandidate = false,
                                onViewSession,
                                onJoinAsCandidate,
                                onVote,
                                onShowResults,
                            }: SessionCardProps) {
    const { colorClass, label, accentClass } = statusConfig[status];

    return (
        <Card className={`h-full overflow-hidden border-l-4 ${accentClass} hover:shadow-md transition-shadow`}>
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={bannerUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <Badge className={`absolute right-3 top-3 ${colorClass}`}>
                    {label}
                </Badge>
            </div>

            <CardContent className="p-4">
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {description}
                </p>
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2 p-4 pt-0 justify-between">
                {/* Primary action button based on status */}
                <div>
                    {status === "nomination" && !hasAppliedAsCandidate && onJoinAsCandidate && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={onJoinAsCandidate}
                        >
                            <Award className="h-4 w-4" />
                            Join as Candidate
                        </Button>
                    )}

                    {status === "nomination" && hasAppliedAsCandidate && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled
                        >
                            <Award className="h-4 w-4" />
                            Application Submitted
                        </Button>
                    )}

                    {status === "started" && onVote && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={onVote}
                        >
                            <VoteIcon className="h-4 w-4" />
                            Vote Now
                        </Button>
                    )}

                    {status === "ended" && onShowResults && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={onShowResults}
                        >
                            <ChartBar className="h-4 w-4" />
                            View Results
                        </Button>
                    )}

                    {status === "upcoming" && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={onViewSession}
                        >
                            <Calendar className="h-4 w-4" />
                            View Details
                        </Button>
                    )}
                </div>

                {/* Always show view details button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={onViewSession}
                >
                    <Eye className="h-4 w-4" />
                    Details
                </Button>
            </CardFooter>
        </Card>
    );
}