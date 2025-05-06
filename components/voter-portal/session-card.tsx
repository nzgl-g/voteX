
import React, { useState } from 'react';
import { Card } from '@/components/shadcn-ui/card';
import { Button } from '@/components/shadcn-ui/button';
import BadgeLabel from '@/components/voter-portal/badge-label';
import { VoteSession } from './types';
import { ArrowRight, Eye } from 'lucide-react';
import CandidateFormDialog from './candidate-form-dialog';

interface VoteSessionCardProps {
    session: VoteSession;
}

const VoteSessionCard: React.FC<VoteSessionCardProps> = ({ session }) => {
    const [showActionButton, setShowActionButton] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Truncate description if it's too long
    const truncateDescription = (text: string, limit = 150) => {
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    };

    // Determine button text based on session status
    const getActionButton = () => {
        switch (session.status) {
            case 'nominations':
                return (
                    <Button
                        className="bg-vote-nominations hover:bg-vote-nominations/80 w-full"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Join as Candidate
                    </Button>
                );
            case 'upcoming':
                return (
                    <Button
                        variant="outline"
                        className="border-vote-upcoming text-vote-upcoming hover:bg-vote-upcoming/10 w-full"
                    >
                        View Profile
                    </Button>
                );
            case 'started':
                return (
                    <Button
                        className="bg-vote-started hover:bg-vote-started/80 w-full"
                    >
                        Cast Your Vote
                    </Button>
                );
            case 'ended':
                return (
                    <Button
                        variant="outline"
                        className="border-vote-ended text-vote-ended hover:bg-vote-ended/10 w-full"
                    >
                        View Results
                    </Button>
                );
            default:
                return null;
        }
    };

    // Get a banner image based on session status
    const getBannerImage = () => {
        switch (session.status) {
            case 'nominations':
                return 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&h=200';
            case 'upcoming':
                return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&h=200';
            case 'started':
                return 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&h=200';
            case 'ended':
                return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=200';
            default:
                return 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=800&h=200';
        }
    };

    return (
        <>
            <Card
                className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 flex flex-col h-full"
                onMouseEnter={() => setShowActionButton(true)}
                onMouseLeave={() => setShowActionButton(false)}
            >
                {/* Banner Image */}
                <div className="w-full h-40 overflow-hidden">
                    <img
                        src={getBannerImage()}
                        alt={session.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                </div>

                {/* View Profile button that appears on hover */}
                {showActionButton && (
                    <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-300"
                         style={{ opacity: showActionButton ? 1 : 0 }}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/80 backdrop-blur-sm hover:bg-white flex items-center gap-1 rounded-full"
                        >
                            <span className="text-xs">View</span>
                            <Eye className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                <div className="p-5 space-y-4 flex-grow flex flex-col">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <BadgeLabel type="voting" value={session.votingType} />
                        <BadgeLabel type="status" value={session.status} />
                    </div>

                    {/* Title and Description */}
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold line-clamp-2">{session.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            {truncateDescription(session.description)}
                        </p>
                    </div>

                    {/* Action Button - fixed at bottom */}
                    <div className="pt-2">
                        {getActionButton()}
                    </div>
                </div>
            </Card>

            {/* Candidate Form Dialog */}
            <CandidateFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                sessionId={session.id}
                sessionTitle={session.title}
            />
        </>
    );
};

export default VoteSessionCard;