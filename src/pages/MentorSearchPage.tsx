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

    // 1. Interests (40%) - Based on intersection of interests
    const mentorInterests = Array.isArray(mentor.interests) ? mentor.interests : [];
    const menteeInterests = Array.isArray(mentee.interests) ? mentee.interests : [];
    const interestIntersection = mentorInterests.filter(i => menteeInterests.includes(i));

    if (interestIntersection.length > 0) {
        score += 40;
        breakdown.push({ criterion: 'Intereses', status: 'Exacta' });
    } else {
        breakdown.push({ criterion: 'Intereses', status: 'No Coincide' });
    }

    // 2. Mentorship Goals (35%)
    const mentorGoals = Array.isArray(mentor.mentorshipGoals) ? mentor.mentorshipGoals : [];
    const menteeGoals = Array.isArray(mentee.mentorshipGoals) ? mentee.mentorshipGoals : [];
    const goalIntersection = mentorGoals.filter(g => menteeGoals.includes(g));

    if (goalIntersection.length > 0) {
        score += 35;
        breakdown.push({ criterion: 'Objetivos de Mentoría', status: 'Exacta' });
    } else {
        breakdown.push({ criterion: 'Objetivos de Mentoría', status: 'No Coincide' });
    }

    // 3. Availability (25%)
    // Compare availability schedules between mentee and mentor
    // Count how many time slots match on the same dates
    const menteeAvailability = mentee.availability || {};
    const mentorAvailability = mentor.availability || {};
    
    let matchingTimeSlots = 0;
    
    // Iterate through all dates in mentee's availability
    Object.keys(menteeAvailability).forEach(date => {
        // Check if mentor also has availability on this date
        if (mentorAvailability[date]) {
            const menteeTimes = menteeAvailability[date];
            const mentorTimes = mentorAvailability[date];
            
            // Count how many time slots match on this date
            const matchesOnDate = menteeTimes.filter(time => mentorTimes.includes(time)).length;
            matchingTimeSlots += matchesOnDate;
        }
    });
    
    // Determine status based on number of matching time slots
    if (matchingTimeSlots >= 2) {
        score += 25;
        breakdown.push({ criterion: 'Disponibilidad', status: 'Exacta' });
    } else if (matchingTimeSlots === 1) {
        breakdown.push({ criterion: 'Disponibilidad', status: 'Parcial' });
    } else {
        breakdown.push({ criterion: 'Disponibilidad', status: 'No Coincide' });
    }

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
        if (!currentUser) {
            console.log('MentorSearchPage: No current user found.');
            return [];
        }

        console.log('MentorSearchPage: Calculating affinity for user:', currentUser);
        console.log('MentorSearchPage: Mentors to process:', mentors);

        const filtered = mentors.filter(mentor => {
            const searchLower = searchTerm.toLowerCase();
            const mentorInterests = Array.isArray(mentor.interests) ? mentor.interests : [];

            const matchesSearch = mentor.name.toLowerCase().includes(searchLower) ||
                mentor.title.toLowerCase().includes(searchLower) ||
                mentor.company.toLowerCase().includes(searchLower) ||
                mentorInterests.some(e => typeof e === 'string' && e.toLowerCase().includes(searchLower));

            const matchesCategory = selectedCategory === 'all' || mentorInterests.includes(selectedCategory);
            return matchesSearch && matchesCategory;
        });

        return filtered.map(mentor => {
            try {
                return {
                    mentor,
                    matchDetails: calculateMatch(mentor, currentUser)
                };
            } catch (err) {
                console.error('Error calculating match for mentor:', mentor.id, err);
                return {
                    mentor,
                    matchDetails: { affinityScore: 0, breakdown: [] }
                };
            }
        }).sort((a, b) => b.matchDetails.affinityScore - a.matchDetails.affinityScore);

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