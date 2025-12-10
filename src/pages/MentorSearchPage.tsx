import React, { useState, useMemo, useEffect } from 'react';
import type { Mentor, Mentee } from '../types';
import { useAuth } from '../context/AuthContext';
import MentorCard from '../components/mentors/MentorCard';
import { useProfileOptions } from '../hooks/useProfileOptions';
import { fetchActiveMentorshipsForUser } from '../services/mentorshipService';

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

// FIX: Refactored functionality to correctly match availability.
// Now handles both specific dates and recurring days, and implements the requested scoring logic:
// >= 2 matching blocks: Exact
// 1 matching block: Partial
// 0 matching blocks: No Match
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
    const menteeAvailability = mentee.availability || {};
    const mentorAvailability = mentor.availability || {};

    let matchingTimeSlots = 0;

    // Helper to get day of week from a date string "YYYY-MM-DD"
    const getDayName = (dateStr: string) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        // Append T00:00:00 to avoid timezone shifts when parsing YYYY-MM-DD
        return days[new Date(dateStr + 'T00:00:00').getDay()];
    };

    // Iterate through all availability keys from mentee (could be "monday", "tuesday" or "2024-05-20")
    Object.keys(menteeAvailability).forEach(menteeKey => {
        const menteeTimes = menteeAvailability[menteeKey];

        // We need to check if mentor has availability for this key.
        // Cases:
        // A) Key is a day name (e.g. "monday") -> Check mentorAvailability["monday"]
        // B) Key is a specific date (e.g. "2024-05-20") -> Check mentorAvailability["2024-05-20"] matches OR mentorAvailability["monday"] matches recurringly

        // Check exact key match first
        let mentorTimesRaw = mentorAvailability[menteeKey] || [];

        // If no exact match and key looks like a date, check the corresponding day name in mentor's recurring availability
        const isDate = /^\d{4}-\d{2}-\d{2}$/.test(menteeKey);
        if (mentorTimesRaw.length === 0 && isDate) {
            const dayName = getDayName(menteeKey);
            if (mentorAvailability[dayName]) {
                mentorTimesRaw = mentorAvailability[dayName];
            }
        }

        // FIX: Mentor availability is stored as ranges "HH:MM-HH:MM" (e.g. "10:30-11:00")
        // Mentee availability is stored as start times "HH:MM" (e.g. "10:30")
        // We match if the mentee's start time equals the mentor's range start time.
        const mentorStartTimes = mentorTimesRaw.map(t => t.split('-')[0]);

        // Count overlapping slots
        const matchesInBlock = menteeTimes.filter(time => mentorStartTimes.includes(time)).length;

        if (matchesInBlock > 0) {
            // Count each matching block as 1 "coincidence" (or could count individual slots)
            matchingTimeSlots += matchesInBlock;
        }
    });

    // Determine status based on user rules
    if (matchingTimeSlots >= 2) {
        score += 25; // Full score for Exacta
        breakdown.push({ criterion: 'Disponibilidad', status: 'Exacta' });
    } else if (matchingTimeSlots === 1) {
        score += 15; // Partial score
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

    // NEW: State for active mentorships
    const [activeMentorIds, setActiveMentorIds] = useState<Set<string>>(new Set());

    // NEW: Fetch active mentorships on mount/user change
    useEffect(() => {
        const loadActiveMentorships = async () => {
            if (currentUser?.id) {
                const ids = await fetchActiveMentorshipsForUser(currentUser.id.toString());
                setActiveMentorIds(new Set(ids));
            }
        };
        loadActiveMentorships();
    }, [currentUser?.id]);

    const mentorsWithAffinity = useMemo(() => {
        if (!currentUser) {
            console.log('MentorSearchPage: No current user found.');
            return [];
        }

        console.log('MentorSearchPage: Calculating affinity for user:', currentUser);
        console.log('MentorSearchPage: Mentors to process:', mentors);

        const filtered = mentors.filter(mentor => {
            // NEW: Filter out active mentors
            if (activeMentorIds.has(mentor.id.toString())) {
                return false;
            }

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
                // Calculate matching interests between mentor and mentee
                const mentorInterests = Array.isArray(mentor.interests) ? mentor.interests : [];
                const menteeInterests = Array.isArray(currentUser.interests) ? currentUser.interests : [];
                const matchingInterests = mentorInterests.filter(i => menteeInterests.includes(i));

                // Create a modified mentor object with only matching interests for display
                const mentorWithMatchingInterests = {
                    ...mentor,
                    interests: matchingInterests
                };

                return {
                    mentor: mentorWithMatchingInterests,
                    matchDetails: calculateMatch(mentor, currentUser)
                };
            } catch (err) {
                console.error('Error calculating match for mentor:', mentor.id, err);
                return {
                    mentor,
                    matchDetails: { affinityScore: 0, breakdown: [] }
                };
            }
        })
            .filter(({ matchDetails }) => matchDetails.affinityScore > 0)
            .sort((a, b) => b.matchDetails.affinityScore - a.matchDetails.affinityScore);

    }, [mentors, searchTerm, selectedCategory, currentUser, activeMentorIds]);

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