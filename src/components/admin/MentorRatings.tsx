import React, { useMemo } from 'react';
import type { Mentor, Session } from '../../types';
import Card from '../common/Card';
import { TrendingUpIcon } from '../common/Icons';

interface MentorRatingsProps {
    mentors: Mentor[];
    sessions: Session[];
    onSelectMentor: (mentor: Mentor) => void;
}

const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-cyan';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
};

const MentorRatings: React.FC<MentorRatingsProps> = ({ mentors, sessions, onSelectMentor }) => {
    
    const mentorStats = useMemo(() => {
        return mentors.map(mentor => {
            const mentorSessions = sessions.filter(s => s.mentor.id === mentor.id && s.status === 'completed');
            const ratedSessions = mentorSessions.filter(s => s.rating);
            const totalRatings = ratedSessions.reduce((acc, s) => acc + (s.rating || 0), 0);
            const avgRating = ratedSessions.length > 0 ? (totalRatings / ratedSessions.length) : 0;
            
            const score = (avgRating * 10) + (mentorSessions.length * 2);

            return {
                ...mentor,
                score: score.toFixed(1),
                sessionCount: mentorSessions.length
            };
        }).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    }, [mentors, sessions]);

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-foreground/80">Rendimiento de Mentoras</h3>
            <Card className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                    <ul className="divide-y divide-border">
                        {mentorStats.map(mentor => (
                            <li 
                                key={mentor.id} 
                                onClick={() => onSelectMentor(mentor)}
                                className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer"
                            >
                                <div className="flex items-center space-x-4">
                                    <img src={mentor.avatarUrl} alt={mentor.name} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <p className="font-bold">{mentor.name}</p>
                                        <p className="text-sm text-muted-foreground">{mentor.title}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <div className={`flex items-center gap-1 font-bold text-lg ${getScoreColor(parseFloat(mentor.score))}`}>
                                        <TrendingUpIcon className="w-5 h-5"/>
                                        <span>{mentor.score}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Puntuación de Rendimiento</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default MentorRatings;