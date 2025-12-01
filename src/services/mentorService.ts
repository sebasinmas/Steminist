import { supabase } from '../lib/supabase';
import type { Mentor } from '../types';

export const fetchMentors = async (): Promise<Mentor[]> => {
    try {
        const { data, error } = await supabase
            .schema('models')
            .from('users')
            .select('id, first_name, last_name, email, avatar_url, timezone')
            .eq('role', 'mentor');

        if (error) {
            console.error('Error fetching mentors:', error);
            return [];
        }

        if (!data) return [];

        // Map Supabase users to Mentor type with default values for missing fields
        const mentors: Mentor[] = data.map((user: any) => {
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';
            // Construct full name, prioritizing last_name if that's what the user emphasized, 
            // but standard is "First Last". User said "last_name is the real name", 
            // which might imply first_name is empty or secondary. We'll use both.
            const fullName = `${firstName} ${lastName}`.trim() || 'Mentor Sin Nombre';

            return {
                id: user.id, // Keep UUID from DB
                name: fullName,
                email: user.email || '',
                role: 'mentor',
                avatarUrl: user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (fullName || 'default'),
                expertise: [], // Not in the verified query
                availability: {}, // Default empty
                title: 'Mentor', // Default
                company: 'N/A', // Default
                roleLevel: 'mid', // Default
                timezone: user.timezone || 'UTC',
                motivations: [], // Default
                rating: 5.0, // Default
                reviews: 0, // Default
                longBio: 'No hay biografía disponible.', // Default
                mentoringTopics: [], // Default
                maxMentees: 5, // Default
                links: [],
                // Adding fields to satisfy potential type mismatches or union types
                mentorshipGoals: [],
                interests: []
            } as unknown as Mentor;
        });

        return mentors;
    } catch (err) {
        console.error('Unexpected error fetching mentors:', err);
        return [];
    }
};
