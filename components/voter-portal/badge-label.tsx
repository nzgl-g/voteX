
import React from 'react';
import { cn } from '@/lib/utils';
import { VotingType, SessionLifecycle } from "./types";

interface BadgeLabelProps {
    type: 'status' | 'voting';
    value: VotingType | SessionLifecycle;
    className?: string;
}

export const BadgeLabel: React.FC<BadgeLabelProps> = ({
                                                          type,
                                                          value,
                                                          className
                                                      }) => {
    // Styling based on type and value
    const getBadgeStyles = () => {
        const baseStyles = "py-1 px-3 rounded-full text-xs font-medium text-white flex items-center";

        if (type === 'voting') {
            switch(value) {
                case 'poll':
                    return `bg-vote-poll ${baseStyles}`;
                case 'election':
                    return `bg-vote-election ${baseStyles}`;
                case 'tournament':
                    return `bg-vote-tournament ${baseStyles}`;
                default:
                    return `bg-muted ${baseStyles}`;
            }
        } else {
            // Status badges
            switch(value) {
                case 'nominations':
                    return `bg-vote-nominations animate-pulse-subtle ${baseStyles}`;
                case 'upcoming':
                    return `bg-vote-upcoming ${baseStyles}`;
                case 'started':
                    return `bg-vote-started ${baseStyles}`;
                case 'ended':
                    return `bg-vote-ended ${baseStyles}`;
                default:
                    return `bg-muted ${baseStyles}`;
            }
        }
    };

    // Format label text
    const getFormattedLabel = () => {
        const label = value.toString();
        return label.charAt(0).toUpperCase() + label.slice(1);
    };

    return (
        <span className={cn(getBadgeStyles(), className)}>
      {getFormattedLabel()}
    </span>
    );
};

export default BadgeLabel;