import { supabase } from '../lib/supabase';
import type { Mentor, Mentorship } from '../types';

export const fetchMentors = async (): Promise<Mentor[]> => {
    try {
        const { data, error } = await supabase
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
}

// ... (código existente fetchMentors) ...

export const mentorService = {
    // Crear una nueva mentoría (al aprobar solicitud)
    createMentorship: async (mentorId: string | number, menteeId: string | number, requestId: number) => {
        const { data, error } = await supabase
            .from('mentorships')
            .insert([{
                mentor_id: mentorId,
                mentee_id: menteeId,
                connection_request_id: requestId,
                status: 'active',
                start_date: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Obtener todas las mentorías (para admin y dashboard)
    fetchMentorships: async (): Promise<Mentorship[]> => {
        const { data, error } = await supabase
            .from('mentorships')
            .select(`
                id,
                status,
                start_date,
                termination_reason,
                mentor:users!mentor_id (
                    id, first_name, last_name, avatar_url, email,
                    mentor_profiles (title, company, bio, max_mentees, interests)
                ),
                mentee:users!mentee_id (
                    id, first_name, last_name, avatar_url, email,
                    mentee_profiles (title, company, bio, pronouns, neurodivergence_details, interests, mentorship_goals)
                )
            `);

        if (error) {
            console.error('Error fetching mentorships:', error);
            return [];
        }

        // Mapeo de datos DB a tipos de Frontend
        return (data || []).map((m: any) => ({
            id: m.id,
            status: m.status,
            startDate: m.start_date,
            terminationReason: m.termination_reason,
            sessions: [], // Las sesiones se cargarían aparte si fuera necesario
            mentor: {
                id: m.mentor.id,
                name: `${m.mentor.first_name} ${m.mentor.last_name}`.trim(),
                email: m.mentor.email,
                avatarUrl: m.mentor.avatar_url || 'https://via.placeholder.com/150',
                role: 'mentor',
                title: m.mentor.mentor_profiles?.[0]?.title || '',
                company: m.mentor.mentor_profiles?.[0]?.company || '',
                maxMentees: m.mentor.mentor_profiles?.[0]?.max_mentees || 3,
                interests: m.mentor.mentor_profiles?.[0]?.interests || [],
                // ... otros campos por defecto
                rating: 0, reviews: 0, longBio: '', availability: {}, mentorshipGoals: []
            },
            mentee: {
                id: m.mentee.id,
                name: `${m.mentee.first_name} ${m.mentee.last_name}`.trim(),
                email: m.mentee.email,
                avatarUrl: m.mentee.avatar_url || 'https://via.placeholder.com/150',
                role: 'mentee',
                title: m.mentee.mentee_profiles?.[0]?.title || '',
                company: m.mentee.mentee_profiles?.[0]?.company || '',
                bio: m.mentee.mentee_profiles?.[0]?.bio || '',
                interests: m.mentee.mentee_profiles?.[0]?.interests || [],
                mentorshipGoals: m.mentee.mentee_profiles?.[0]?.mentorship_goals || [],
                pronouns: m.mentee.mentee_profiles?.[0]?.pronouns,
                neurodivergence: m.mentee.mentee_profiles?.[0]?.neurodivergence_details,
                availability: {}
            }
        })) as Mentorship[];
    }
};
