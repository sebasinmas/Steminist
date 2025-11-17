import React from 'react';
import type { Mentee, Page, Mentorship } from '../../types';
import Card from '../common/Card';

interface MentorConnectionsCardProps {
    mentorships: Mentorship[];
    onSelectMentorship: (mentorship: Mentorship) => void;
    selectedMentorshipId?: number | null;
}

const MentorConnectionsCard: React.FC<MentorConnectionsCardProps> = ({ mentorships, onSelectMentorship, selectedMentorshipId }) => {
    
    const SubtitleWithTooltip: React.FC<{ mentee: Mentee }> = ({ mentee }) => {
        const info = [mentee.pronouns, mentee.neurodivergence].filter(Boolean).join(' | ');
        
        if (!info) {
            return <div className="h-5"></div>; // Placeholder to maintain height
        }

        // Simple check to see if we should truncate
        const needsTooltip = info.length > 25;

        return (
            <div className="relative group text-sm text-muted-foreground max-w-[150px]">
                <p className="truncate">{info}</p>
                {needsTooltip && (
                    <div className="absolute hidden group-hover:block bottom-full mb-1 w-max max-w-xs p-2 text-xs bg-popover text-foreground border border-border rounded-md shadow-lg z-10 break-words">
                        {info}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card>
            <h3 className="text-lg font-bold mb-4">Mis Mentoreadas ({mentorships.length})</h3>
            {mentorships.length > 0 ? (
                 <ul className="space-y-2">
                    {mentorships.map(mentorship => {
                        const mentee = mentorship.mentee;
                        const isSelected = mentorship.id === selectedMentorshipId;
                        return (
                            <li key={mentee.id}>
                                <button
                                    onClick={() => onSelectMentorship(mentorship)}
                                    className={`w-full flex items-start space-x-3 p-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}`}
                                    aria-pressed={isSelected}
                                >
                                    <img src={mentee.avatarUrl} alt={mentee.name} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
                                    <div className="flex flex-col items-start">
                                        <p className="font-semibold">{mentee.name}</p>
                                        <SubtitleWithTooltip mentee={mentee} />
                                    </div>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No tienes mentoreadas activas.</p>
            )}
        </Card>
    );
};

export default MentorConnectionsCard;