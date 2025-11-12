import React from 'react';
import { SparklesIcon } from '../common/Icons';
import Card from '../common/Card';

interface AffirmationCardProps {
    affirmation: string;
}

const AffirmationCard: React.FC<AffirmationCardProps> = ({ affirmation }) => {
    return (
        <Card className="bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground p-6 flex items-center space-x-4">
            <SparklesIcon className="w-8 h-8 flex-shrink-0" />
            <div>
                <h3 className="font-semibold text-lg">¡Un impulso rápido!</h3>
                <p className="text-sm">{affirmation}</p>
            </div>
        </Card>
    );
};

export default AffirmationCard;