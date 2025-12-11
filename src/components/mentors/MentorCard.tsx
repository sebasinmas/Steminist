import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mentor } from '../../types';
import type { MatchDetails } from '../../pages/MentorSearchPage';
import Card from '../common/Card';
import Tag from '../common/Tag';
import Button from '../common/Button';
import { StarIcon, BriefcaseIcon, UsersIcon, CalendarIcon, GlobeAltIcon, HeartIcon, ChevronDownIcon } from '../common/Icons';
import { Avatar } from '../common/Avatar';

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);

    React.useEffect(() => {
        const progressOffset = circumference - (percentage / 100) * circumference;
        const timer = setTimeout(() => setOffset(progressOffset), 100);
        return () => clearTimeout(timer);
    }, [percentage, circumference]);

    const getStrokeColor = (p: number) => {
        if (p >= 90) return 'stroke-cyan-400';
        if (p >= 70) return 'stroke-blue-400';
        if (p > 40) return 'stroke-lilac';
        return 'stroke-slate-500';
    };

    return (
        <div className="relative flex-shrink-0 flex items-center justify-center w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle className="text-slate-700" strokeWidth="5" stroke="currentColor" fill="transparent" r={radius} cx="32" cy="32" />
                <circle
                    className={`transition-all duration-1000 ease-out ${getStrokeColor(percentage)}`}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="32"
                    cy="32"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-foreground">{`${percentage}%`}</span>
                <span className="text-xs text-muted-foreground -mt-1">Afinidad</span>
            </div>
        </div>
    );
};


interface MentorCardProps {
    mentor: Mentor;
    matchDetails: MatchDetails;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
    'Intereses': StarIcon,
    'Objetivos de Mentoría': BriefcaseIcon,
    'Disponibilidad': CalendarIcon,
};

const MentorCard: React.FC<MentorCardProps> = ({ mentor, matchDetails }) => {
    const [isBreakdownVisible, setIsBreakdownVisible] = useState(false);
    const navigate = useNavigate();

    const getMatchStatusColor = (status: MatchDetails['breakdown'][0]['status']) => {
        switch (status) {
            case 'Exacta': return 'text-green-400';
            case 'Parcial': return 'text-yellow-400';
            default: return 'text-red-400';
        }
    };

    const handleNavigate = () => {
        navigate(`/mentor/${mentor.id}`);
    };

    return (
        <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-2xl">
            <div className="flex-grow cursor-pointer" onClick={handleNavigate}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-grow pr-4 min-w-0">
                        <Avatar src={mentor.avatarUrl} alt={mentor.name} className="w-16 h-16 flex-shrink-0" />
                        <div className="pt-1 flex-1 min-w-0">
                            <h3 className="text-xl font-bold break-words">{mentor.name}</h3>
                            <p className="text-primary break-words">{mentor.title}</p>
                            <p className="text-sm text-muted-foreground break-words">{mentor.company}</p>
                        </div>
                    </div>
                    <CircularProgress percentage={matchDetails.affinityScore} />
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{mentor.longBio}</p>
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(mentor.interests) && mentor.interests.slice(0, 3).map(tag => <Tag key={tag}>{tag}</Tag>)}
                    {Array.isArray(mentor.interests) && mentor.interests.length > 3 && <Tag>+ {mentor.interests.length - 3} más</Tag>}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                    <button
                        className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center transition-colors"
                        onClick={(e) => { e.stopPropagation(); setIsBreakdownVisible(!isBreakdownVisible); }}
                        aria-expanded={isBreakdownVisible}
                    >
                        Ver desglose de afinidad
                        <ChevronDownIcon className={`ml-1 w-4 h-4 transition-transform duration-300 ${isBreakdownVisible ? 'rotate-180' : ''}`} />
                    </button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleNavigate(); }}>Ver Perfil</Button>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isBreakdownVisible ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                    <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                        {matchDetails.breakdown.map(({ criterion, status }) => {
                            const Icon = iconMap[criterion] || StarIcon;
                            return (
                                <div key={criterion} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                        <span>{criterion}</span>
                                    </div>
                                    <span className={`font-semibold ${getMatchStatusColor(status)}`}>{status}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default MentorCard;