import React, { useMemo } from 'react';
import type { Session, Mentee } from '../../../types';
import Card from '../common/Card';
import { TrendingUpIcon } from '../common/Icons';

interface MenteeActivityProps {
    sessions: Session[];
    onSelectMentee: (mentee: Mentee) => void;
}

const getScoreColor = (score: number) => {
    if (score >= 30) return 'text-cyan';
    if (score >= 15) return 'text-orange-500';
    return 'text-red-500';
};

const MenteeActivity: React.FC<MenteeActivityProps> = ({ sessions, onSelectMentee }) => {
    
    const menteeStats = useMemo(() => {
        const menteesMap = new Map<number, { mentee: Mentee, totalSessions: number, completedSessions: number, feedbackCount: number }>();
        
        sessions.forEach(session => {
            if (!menteesMap.has(session.mentee.id)) {
                menteesMap.set(session.mentee.id, { 
                    mentee: session.mentee, 
                    totalSessions: 0,
                    completedSessions: 0,
                    feedbackCount: 0
                });
            }
            const menteeData = menteesMap.get(session.mentee.id)!;
            menteeData.totalSessions += 1;
            if (session.status === 'completed') {
                menteeData.completedSessions += 1;
                if (session.feedback && session.rating) {
                    menteeData.feedbackCount += 1;
                }
            }
        });

        return Array.from(menteesMap.values()).map(data => {
            const completionRate = data.totalSessions > 0 ? (data.completedSessions / data.totalSessions) : 0;
            // Simple scoring: 2 points per completed session, 10 for completion rate ratio, 5 per feedback provided
            const score = (data.completedSessions * 2) + (completionRate * 10) + (data.feedbackCount * 5);
            return {
                mentee: data.mentee,
                completedSessions: data.completedSessions,
                score: score.toFixed(1)
            }
        }).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    }, [sessions]);

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-foreground/80">Rendimiento de Mentoreadas</h3>
             <Card className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                    <ul className="divide-y divide-border">
                        {menteeStats.map(({ mentee, score, completedSessions }) => (
                            <li 
                                key={mentee.id} 
                                onClick={() => onSelectMentee(mentee)}
                                className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer"
                            >
                                <div className="flex items-center space-x-4">
                                    <img src={mentee.avatarUrl} alt={mentee.name} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <p className="font-bold">{mentee.name}</p>
                                        <p className="text-sm text-muted-foreground">{completedSessions} sesiones completadas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <div className={`flex items-center gap-1 font-bold text-lg ${getScoreColor(parseFloat(score))}`}>
                                        <TrendingUpIcon className="w-5 h-5"/>
                                        <span>{score}</span>
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

export default MenteeActivity;