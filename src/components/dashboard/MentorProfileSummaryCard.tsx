import React from 'react';
import type { Mentor } from '../../../types';
import Card from '../common/Card';
import Button from '../common/Button';

interface MentorProfileSummaryCardProps {
    mentor: Mentor;
}

const MentorProfileSummaryCard: React.FC<MentorProfileSummaryCardProps> = ({ mentor }) => {
    return (
        <Card className="text-center">
            <img src={mentor.avatarUrl} alt={mentor.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary/20" />
            <h2 className="text-xl font-bold">{mentor.name}</h2>
            <p className="text-md text-muted-foreground mb-1">{mentor.title}</p>
            <p className="text-sm text-muted-foreground mb-4">{mentor.company}</p>
            <div className="border-t border-border pt-4">
                {/* In a real app, this would link to the public profile page */}
                <Button variant="secondary" className="w-full">View My Profile</Button>
            </div>
        </Card>
    );
};

export default MentorProfileSummaryCard;
