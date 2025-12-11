import { supabase } from '../lib/supabase';
import type { Mentor, Mentorship } from '../types';


export const fetchMentors = async (): Promise<Mentor[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, avatar_url, mentor_profiles(interests, mentorship_goals, bio, title, company, average_rating, total_reviews, max_mentees, expertise), availability_blocks(day_of_week, start_time, end_time), mentorships!mentor_id(id, status)')
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

            // Calculate active mentees count
            const activeMenteesCount = user.mentorships
                ? user.mentorships.filter((m: any) => m.status === 'active').length
                : 0;

            return {
                id: user.id, // Keep UUID from DB
                name: fullName,
                email: user.email || '',
                role: 'mentor',
                avatarUrl: user.avatar_url || null,
                expertise: user.expertise || [], // Legacy field, might not be used
                availability: availability,
                title: profile?.title || 'Mentor',
                company: profile?.company || 'N/A',
                experience: profile?.expertise || 'Mid',
                timezone: user.timezone || 'UTC',
                motivations: user.motivations || [],
                rating: profile?.average_rating ?? 0,
                reviews: profile?.total_reviews ?? 0,
                longBio: profile?.bio || 'No hay biografía disponible.',
                mentoringTopics: user.mentoring_topics || [],
                maxMentees: profile?.max_mentees || 5,
                activeMenteesCount: activeMenteesCount,
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
        return (data || []).map((m: any) => {
            const mentorProfile = Array.isArray(m.mentor.mentor_profiles) ? m.mentor.mentor_profiles[0] : m.mentor.mentor_profiles;
            const menteeProfile = Array.isArray(m.mentee.mentee_profiles) ? m.mentee.mentee_profiles[0] : m.mentee.mentee_profiles;

            return {
                id: m.id,
                status: m.status,
                startDate: m.start_date,
                terminationReason: m.termination_reason,
                sessions: [], // Las sesiones se cargarían aparte si fuera necesario
                mentor: {
                    id: m.mentor.id,
                    name: `${m.mentor.first_name} ${m.mentor.last_name}`.trim(),
                    email: m.mentor.email,
                    avatarUrl: m.mentor.avatar_url || null,
                    role: 'mentor',
                    title: mentorProfile?.title || '',
                    company: mentorProfile?.company || '',
                    maxMentees: mentorProfile?.max_mentees || 5,
                    interests: mentorProfile?.interests || [],
                    // ... otros campos por defecto
                    rating: 0, reviews: 0, longBio: '', availability: {}, mentorshipGoals: []
                },
                mentee: {
                    id: m.mentee.id,
                    name: `${m.mentee.first_name} ${m.mentee.last_name}`.trim(),
                    email: m.mentee.email,
                    avatarUrl: m.mentee.avatar_url || null,
                    role: 'mentee',
                    title: menteeProfile?.title || '',
                    company: menteeProfile?.company || '',
                    bio: menteeProfile?.bio || '',
                    interests: menteeProfile?.interests || [],
                    mentorshipGoals: menteeProfile?.mentorship_goals || [],
                    pronouns: menteeProfile?.pronouns,
                    neurodivergence: menteeProfile?.neurodivergence_details,
                    availability: {}
                }
            };
        }) as Mentorship[];
    }
};

export const updateMentorMaxMentees = async (mentorId: string, maxMentees: number): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('mentor_profiles')
            .update({ max_mentees: maxMentees })
            .eq('user_id', mentorId);

        if (error) {
            console.error('Error updating max mentees:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Unexpected error updating max mentees:', err);
        return false;
    }
};


const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};


const getDayOfWeekString = (dayIndex: number): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
};


const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};



export const getMentorAvailability = async (mentorId: number | string): Promise<Record<string, string[]>> => {
    const startDate = new Date();
    const endDate = addDays(startDate, 30); 

    // 1. Obtener bloques (sin cambios)
    const { data: blocks, error: blocksError } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('user_id', mentorId)
        .eq('is_booked', false);

    if (blocksError) {
        console.error('Error fetching availability blocks:', blocksError);
        return {};
    }


    const { data: existingSessions, error: sessionsError } = await supabase
        .rpc('get_mentor_booked_slots', { 
            target_mentor_id: mentorId 
        });

    if (sessionsError) {
        console.error('Error fetching booked slots:', sessionsError);
    }

    const availabilityMap: Record<string, string[]> = {};
    const bookedMap: Record<string, string[]> = {};

    if (existingSessions) {
        existingSessions.forEach((session: { scheduled_at: string }) => {
      
            const dateObj = new Date(session.scheduled_at);
            

            const year = dateObj.getUTCFullYear();
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            

            const hour = String(dateObj.getUTCHours()).padStart(2, '0');
            const minute = String(dateObj.getUTCMinutes()).padStart(2, '0');
            const timeKey = `${hour}:${minute}`;
            
            if (!bookedMap[dateKey]) bookedMap[dateKey] = [];
            bookedMap[dateKey].push(timeKey);
        });
    }


    for (let d = 0; d < 30; d++) {
        const currentDate = addDays(startDate, d);
        const dateKey = getLocalDateString(currentDate); 
        const dayOfWeek = getDayOfWeekString(currentDate.getDay());
        
        let daySlots: string[] = [];

        blocks?.forEach(block => {
            let isMatch = false;

            if (block.specific_date === dateKey) {
                isMatch = true;
            } else if (block.is_recurring && block.day_of_week?.toLowerCase() === dayOfWeek && !block.specific_date) {
                isMatch = true;
            }

            if (isMatch) {
             
                const startTime = block.start_time.slice(0, 5); 
                
               
                const isBooked = bookedMap[dateKey]?.includes(startTime);

                if (!isBooked) {
                    daySlots.push(startTime);
                }
            }
        });

        if (daySlots.length > 0) {
            availabilityMap[dateKey] = [...new Set(daySlots)].sort();
        }
    }

    return availabilityMap;
};