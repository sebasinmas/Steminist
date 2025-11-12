import React, { useState, useMemo } from 'react';
import type { Mentor, Page, Mentee } from '../types';
import MentorCard from '../components/mentors/MentorCard';
import { MENTORSHIP_CATEGORIES } from '../constants';

interface MentorSearchPageProps {
    mentors: Mentor[];
    navigateTo: (page: Page, data?: Mentor) => void;
    currentUser: Mentee;
}

export type MatchStatus = 'Exacta' | 'Parcial' | 'No Coincide';
export interface MatchBreakdown {
    criterion: string;
    status: MatchStatus;
    icon: React.FC<{className?: string}>;
}
export interface MatchDetails {
    affinityScore: number;
    breakdown: MatchBreakdown[];
}

// A simple algorithm to calculate affinity
const calculateMatch = (mentor: Mentor, mentee: Mentee): MatchDetails => {
    let score = 0;
    const breakdown: Partial<Record<string, MatchStatus>> = {};

    // Expertise (Mentoring Topics vs Mentorship Goals)
    const topicIntersection = (mentor.mentoringTopics || []).filter(topic => (mentee.mentorshipGoals || []).includes(topic));
    if (topicIntersection.length > 1) {
        score += 40;
        breakdown['Expertise'] = 'Exacta';
    } else if (topicIntersection.length > 0) {
        score += 20;
        breakdown['Expertise'] = 'Parcial';
    }

    // Role Level
    if (mentor.roleLevel && mentee.roleLevel) {
        const roleHierarchy = { 'entry': 1, 'mid': 2, 'senior': 3, 'lead': 4 };
        if (roleHierarchy[mentor.roleLevel] >= roleHierarchy[mentee.roleLevel]) {
            score += 20;
            breakdown['Nivel de Rol'] = 'Exacta';
        }
    }

    // Timezone
    if (mentor.timezone && mentee.timezone) {
        if (mentor.timezone === mentee.timezone) {
            score += 15;
            breakdown['Huso Horario'] = 'Exacta';
        } else {
            // Simple check for partial match (e.g., within Americas)
            const mentorContinent = mentor.timezone.split('/')[0];
            const menteeContinent = mentee.timezone.split('/')[0];
            if (mentorContinent === menteeContinent) {
                score += 5;
                breakdown['Huso Horario'] = 'Parcial';
            }
        }
    }

    // Motivations
    const motivationIntersection = (mentor.motivations || []).filter(m => (mentee.motivations || []).includes(m));
     if (motivationIntersection.length > 0) {
        score += 15;
        breakdown['Motivaciones'] = 'Exacta';
    }
    
    // Static ones for prototype feel
    breakdown['Comunicación'] = 'Exacta';
    breakdown['Disponibilidad'] = 'Exacta';
    score += 10;
    
    return {
        affinityScore: Math.min(100, score),
        breakdown: [
            { criterion: 'Expertise', status: breakdown['Expertise'] || 'No Coincide' },
            { criterion: 'Nivel de Rol', status: breakdown['Nivel de Rol'] || 'No Coincide' },
            { criterion: 'Comunicación', status: 'Exacta' },
            { criterion: 'Disponibilidad', status: 'Exacta' },
            { criterion: 'Huso Horario', status: breakdown['Huso Horario'] || 'No Coincide' },
            { criterion: 'Motivaciones', status: breakdown['Motivaciones'] || 'No Coincide' },
        ].filter(b => b.status !== 'No Coincide') as any, // Simplified for now
    };
};


const MentorSearchPage: React.FC<MentorSearchPageProps> = ({ mentors, navigateTo, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const mentorsWithAffinity = useMemo(() => {
        const filtered = mentors.filter(mentor => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = mentor.name.toLowerCase().includes(searchLower) ||
                mentor.title.toLowerCase().includes(searchLower) ||
                mentor.company.toLowerCase().includes(searchLower) ||
                mentor.expertise.some(e => e.toLowerCase().includes(searchLower));
            
            const matchesCategory = selectedCategory === 'all' || mentor.expertise.includes(selectedCategory);
            
            return matchesSearch && matchesCategory;
        });
        
        return filtered.map(mentor => ({
            mentor,
            matchDetails: calculateMatch(mentor, currentUser)
        })).sort((a, b) => b.matchDetails.affinityScore - a.matchDetails.affinityScore);

    }, [mentors, searchTerm, selectedCategory, currentUser]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-2">Encuentra tu Mentora Ideal</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Explora nuestra red de expertas en STEM y conecta con alguien que pueda guiarte en tu carrera.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-20 bg-background/80 backdrop-blur-sm py-4 z-10">
                <input
                    type="text"
                    placeholder="Buscar por nombre, rol o especialidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:flex-grow p-3 border border-border rounded-lg bg-input"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full md:w-64 p-3 border border-border rounded-lg bg-input"
                >
                    <option value="all">Todas las Categorías</option>
                    {MENTORSHIP_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>
            
            {mentorsWithAffinity.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mentorsWithAffinity.map(({ mentor, matchDetails }) => (
                        <MentorCard 
                            key={mentor.id} 
                            mentor={mentor} 
                            navigateTo={navigateTo}
                            matchDetails={matchDetails}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                    <h2 className="text-2xl font-semibold mb-2">No se encontraron resultados</h2>
                    <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda.</p>
                </div>
            )}
        </div>
    );
};

export default MentorSearchPage;