import React, { useState, useMemo } from 'react';
import type { Mentor, Mentee } from '../types';
import { useAuth } from '../context/AuthContext';
import MentorCard from '../components/mentors/MentorCard';
import { useProfileOptions } from '../hooks/useProfileOptions';

interface MentorSearchPageProps {
    mentors: Mentor[];
}

export type MatchStatus = 'Exacta' | 'Parcial' | 'No Coincide';
export interface MatchBreakdown {
    criterion: string;
    status: MatchStatus;
}
export interface MatchDetails {
    affinityScore: number;
    breakdown: MatchBreakdown[];
}

// FIX: Refactored the function to be more type-safe and avoid assignment errors.
// It now constructs the breakdown array directly with the correct types.
const calculateMatch = (mentor: Mentor, mentee: Mentee): MatchDetails => {
    let score = 0;
    const breakdown: MatchBreakdown[] = [];

    const topicIntersection = (mentor.mentorshipGoals || []).filter(topic => (mentee.mentorshipGoals || []).includes(topic));
    if (topicIntersection.length > 1) {
        score += 40;
        breakdown.push({ criterion: 'Temas de Mentoría', status: 'Exacta' });
    } else if (topicIntersection.length > 0) {
        score += 20;
        breakdown.push({ criterion: 'Temas de Mentoría', status: 'Parcial' });
    }

    if (mentor.experience && mentee.experience) {
        const roleHierarchy = { 'entry': 1, 'mid': 2, 'senior': 3, 'lead': 4 };
        if (roleHierarchy[mentor.experience] >= roleHierarchy[mentee.experience]) {
            score += 20;
            breakdown.push({ criterion: 'Nivel de Experiencia', status: 'Exacta' });
        }
    }

    if (mentor.timezone && mentee.timezone) {
        if (mentor.timezone === mentee.timezone) {
            score += 15;
            breakdown.push({ criterion: 'Huso Horario', status: 'Exacta' });
        } else if (mentor.timezone.split('/')[0] === mentee.timezone.split('/')[0]) {
            score += 5;
            breakdown.push({ criterion: 'Huso Horario', status: 'Parcial' });
        }
    }

    const motivationIntersection = (mentor.motivations || []).filter(m => (mentee.motivations || []).includes(m));
    if (motivationIntersection.length > 0) {
        score += 15;
        breakdown.push({ criterion: 'Motivaciones', status: 'Exacta' });
    }

    // These are always considered exact matches for now and contribute to the score
    breakdown.push({ criterion: 'Comunicación', status: 'Exacta' });
    breakdown.push({ criterion: 'Disponibilidad', status: 'Exacta' });
    score += 10;

    return {
        affinityScore: Math.min(100, Math.floor(score)),
        breakdown: breakdown,
    };
};

const MentorSearchPage: React.FC<MentorSearchPageProps> = ({ mentors }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const { user } = useAuth();
    const { interests: interestOptions, loading } = useProfileOptions();
    const currentUser = user as Mentee; // Assuming user is always a Mentee on this page

    const mentorsWithAffinity = useMemo(() => {
        if (!currentUser) return [];
        const filtered = mentors.filter(mentor => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = mentor.name.toLowerCase().includes(searchLower) ||
                mentor.title.toLowerCase().includes(searchLower) ||
                mentor.company.toLowerCase().includes(searchLower) ||
                mentor.interests.some(e => e.toLowerCase().includes(searchLower));
            const matchesCategory = selectedCategory === 'all' || mentor.interests.includes(selectedCategory);
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
                    {loading ? <option disabled>Cargando...</option> : interestOptions.map(category => (
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