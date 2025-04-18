import { Avatar, AvatarFallback, AvatarImage } from '@/components/shadcn-ui/avatar';
import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription
} from '@/components/shadcn-ui/card';
import { BarChart } from 'lucide-react';
import {mockCandidatesVotesCardGraphData} from "@/lib/mock-data";

const voteResultsData = mockCandidatesVotesCardGraphData;

export function CandidateVoteResults() {
    // Calculate total votes
    const totalVotes = voteResultsData.reduce((sum, candidate) => {
        const votes = parseInt(candidate.votes.replace(/,/g, ''));
        return sum + votes;
    }, 0);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle>Election Results</CardTitle>
                    <CardDescription>Total of {totalVotes.toLocaleString()} votes counted.</CardDescription>
                </div>
                <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div className="space-y-6 flex-grow flex flex-col justify-between">
                    {voteResultsData.map((candidate, index) => (
                        <div
                            key={index}
                            className="flex flex-row items-center w-full min-h-12 transition-all duration-200 hover:bg-muted/30 rounded-md p-2"
                        >
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={candidate.avatar} alt={`${candidate.name}'s avatar`} />
                                <AvatarFallback>{candidate.fallback}</AvatarFallback>
                            </Avatar>

                            <div className="ml-4 flex-grow overflow-hidden">
                                <p className="text-sm font-medium truncate">{candidate.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{candidate.party}</p>
                            </div>

                            <div className="flex-shrink-0 flex flex-col items-end mr-3">
                                <span className="font-medium">{candidate.votes}</span>
                                <span className="text-xs text-muted-foreground">{candidate.percentage}</span>
                            </div>

                            {/* Visual indicator of percentage - responsive width */}
                            <div className="w-16 md:w-24 lg:w-32 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                                <div
                                    className="h-full bg-primary"
                                    style={{
                                        width: candidate.percentage,
                                        opacity: 1 - (index * 0.15) // Gradually reduce opacity for lower positions
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}