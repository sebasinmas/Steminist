import { supabase } from '../lib/supabase';
import type { Mentor } from '../types';

export const fetchMentors = async (): Promise<Mentor[]> => {
    try {
        const { data, error } = await supabase
            .schema('models')
            .from('users')
            .select('id, first_name, last_name, avatar_url, mentor_profiles(interests, mentorship_goals, bio, title, company, average_rating, total_reviews), availability_blocks(day_of_week, start_time, end_time)')
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

            // Handle mentor_profiles being an array (common in Supabase) or object
            const profile = Array.isArray(user.mentor_profiles) ? user.mentor_profiles[0] : user.mentor_profiles;

            // Map availability_blocks to Availability object
            const availability: { [key: string]: string[] } = {};
            if (user.availability_blocks && Array.isArray(user.availability_blocks)) {
                user.availability_blocks.forEach((block: any) => {
                    const day = block.day_of_week.toLowerCase();
                    const timeRange = `${block.start_time.slice(0, 5)}-${block.end_time.slice(0, 5)}`;
                    if (!availability[day]) {
                        availability[day] = [];
                    }
                    availability[day].push(timeRange);
                });
            }

            return {
                id: user.id, // Keep UUID from DB
                name: fullName,
                email: user.email || '',
                role: 'mentor',
                avatarUrl: user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (fullName || 'default'),
                expertise: user.expertise || [],
                availability: availability,
                title: profile?.title || 'Mentor',
                company: profile?.company || 'N/A',
                roleLevel: user.role_level || 'mid',
                timezone: user.timezone || 'UTC',
                motivations: user.motivations || [],
                rating: profile?.average_rating ?? 0,
                reviews: profile?.total_reviews ?? 0,
                longBio: profile?.bio || 'No hay biografía disponible.',
                mentoringTopics: user.mentoring_topics || [],
                maxMentees: user.max_mentees || 5,
                links: user.links || [],
                mentorshipGoals: profile?.mentorship_goals || [],
                interests: profile?.interests || []
            } as unknown as Mentor;
        });

        return mentors;
    } catch (err) {
        console.error('Unexpected error fetching mentors:', err);
        return [];
    }
};
