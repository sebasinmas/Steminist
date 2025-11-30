import { supabase } from '../lib/supabase';
import type { Mentor } from '../types';

export const fetchMentors = async (): Promise<Mentor[]> => {
    try {
        const { data, error } = await supabase
            .schema('models')
            .from('users')
            .select('*')
            .eq('role', 'mentor');

        if (error) {
            console.error('Error fetching mentors:', error);
            return [];
        }

        if (!data) return [];

        // Map Supabase users to Mentor type with default values for missing fields
        const mentors: Mentor[] = data.map((user: any) => ({
            id: user.id, // Keep UUID from DB (Mentor type expects number | string, so this is fine)
            name: user.name || 'Mentor Sin Nombre',
            email: user.email || '',
            role: 'mentor',
            avatarUrl: user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (user.name || 'default'),
            expertise: Array.isArray(user.expertise) ? user.expertise : (user.expertise ? [user.expertise] : []),
            availability: {}, // Default empty
            title: 'Mentor', // Default
            company: 'N/A', // Default
            roleLevel: 'mid', // Default
            timezone: user.timezone || 'UTC',
            motivations: [], // Default
            rating: 5.0, // Default
            reviews: 0, // Default
            longBio: 'No hay biografía disponible.', // Default
            mentoringTopics: Array.isArray(user.expertise) ? user.expertise : (user.expertise ? [user.expertise] : []), // Use expertise as topics
            maxMentees: 5, // Default
            links: [],
            // Adding fields to satisfy potential type mismatches or union types
            mentorshipGoals: [],
            interests: []
        } as unknown as Mentor));

        return mentors;
    } catch (err) {
        console.error('Unexpected error fetching mentors:', err);
        return [];
    }
};
