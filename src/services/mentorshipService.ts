import { supabase } from '../lib/supabase';
import { Mentorship, Mentor, Mentee, Session, SessionStatus, MentorshipStatus, MentorSurvey } from '../types';
import { ratingService } from './ratingService';


export const fetchMentorships = async (): Promise<Mentorship[]> => {
    try {
        const { data, error } = await supabase
            .from('mentorships')
            .select(`
                id,
                status,
                start_date,
                termination_reason,
                mentor:users!mentor_id(
                    id, first_name, last_name, email, role, avatar_url,
                    mentor_profiles(title, company, average_rating, total_reviews, bio, max_mentees)
                ),
                mentee:users!mentee_id(
                    id, first_name, last_name, email, role, avatar_url,
                    mentee_profiles(title, company, bio, pronouns, neurodivergence_details, is_neurodivergent,mentorship_goals)
                ),
                sessions(
                    id,
                    scheduled_at,
                    status,
                    topic,
                    mentee_goals,
                    duration_minutes,
                    video_link,
                    notes,
                    created_at,
                    updated_at,
                    session_feedback(rating, comment),
                    private_session_surveys(preparation, engagement, outcome, notes)
                )
            `);

        if (error) {
            console.error('Error fetching mentorships:', error);
            return [];
        }

        if (!data) return [];

        const mapScoreToQuality = (score: number): 'excellent' | 'good' | 'average' | 'poor' => {
            if (score >= 4) return 'excellent';
            if (score === 3) return 'good';
            if (score === 2) return 'average';
            return 'poor';
        };

        return data.map((item: any) => {
            // Map Mentor
            const mentorProfileData = item.mentor.mentor_profiles;
            const mentorProfile = Array.isArray(mentorProfileData) ? mentorProfileData[0] : (mentorProfileData || {});
            const mentor: Mentor = {
                id: item.mentor.id,
                name: `${item.mentor.first_name || ''} ${item.mentor.last_name || ''}`.trim(),
                first_name: item.mentor.first_name,
                last_name: item.mentor.last_name,
                email: item.mentor.email,
                role: 'mentor',
                avatarUrl: item.mentor.avatar_url || null,
                interests: [], // Not fetched to optimize
                availability: {}, // Not fetched
                title: mentorProfile.title || '',
                company: mentorProfile.company || '',
                rating: mentorProfile.average_rating || 0,
                reviews: mentorProfile.total_reviews || 0,
                longBio: mentorProfile.bio || '',
                mentorshipGoals: [], // Not fetched
                maxMentees: mentorProfile.max_mentees || 3,
            };

            // Map Mentee
            const menteeProfileData = item.mentee.mentee_profiles;
            const menteeProfile = Array.isArray(menteeProfileData) ? menteeProfileData[0] : (menteeProfileData || {});
            const mentee: Mentee = {
                id: item.mentee.id,
                name: `${item.mentee.first_name || ''} ${item.mentee.last_name || ''}`.trim(),
                first_name: item.mentee.first_name,
                last_name: item.mentee.last_name,
                email: item.mentee.email,
                role: 'mentee',
                avatarUrl: item.mentee.avatar_url || '',
                interests: [], // Not fetched
                availability: {}, // Not fetched
                bio: menteeProfile.bio || '',
                title: menteeProfile.title || '',
                company: menteeProfile.company || '',
                mentorshipGoals: menteeProfile.mentorship_goals || [],
                pronouns: menteeProfile.pronouns || '',
                neurodivergence: menteeProfile.neurodivergence_details || '',
                isNeurodivergent: menteeProfile.is_neurodivergent || false,
            };

            // Map Sessions
            const sessions: Session[] = (item.sessions || []).map((session: any, index: number) => {
                const scheduledAtRaw = session.scheduled_at as string | null;

                let dateStr = '';
                let timeStr = '00:00';

                if (scheduledAtRaw) {
                    const scheduledDate = new Date(scheduledAtRaw);

                    // Usamos UTC para respetar exactamente lo que viene de la BD
                    const year = scheduledDate.getUTCFullYear();
                    const month = (scheduledDate.getUTCMonth() + 1).toString().padStart(2, '0');
                    const day = scheduledDate.getUTCDate().toString().padStart(2, '0');
                    const hours = scheduledDate.getUTCHours().toString().padStart(2, '0');
                    const minutes = scheduledDate.getUTCMinutes().toString().padStart(2, '0');

                    dateStr = `${year}-${month}-${day}`;   // 2025-12-19
                    timeStr = `${hours}:${minutes}`;       // 12:00
                }

                // Map Session Feedback
                const feedbackData = Array.isArray(session.session_feedback) ? session.session_feedback[0] : session.session_feedback;
                const feedbackRating = feedbackData?.rating;
                const feedbackComment = feedbackData?.comment;

                // Map Mentor Survey
                const surveyData = Array.isArray(session.private_session_surveys) ? session.private_session_surveys[0] : session.private_session_surveys;
                let mentorSurvey: MentorSurvey | undefined = undefined;

                if (surveyData) {
                    mentorSurvey = {
                        preparation: mapScoreToQuality(surveyData.preparation) as any, // Cast to match type
                        engagement: mapScoreToQuality(surveyData.engagement) as any,
                        outcome: surveyData.notes || surveyData.outcome || '', // 'notes' in DB maps to 'outcome' in frontend
                    };
                }

                return {
                    id: session.id,
                    sessionNumber: index + 1, // Simple numbering
                    date: dateStr,
                    time: timeStr,
                    duration: session.duration_minutes || 60,
                    status: session.status as SessionStatus,
                    topic: session.topic || '',
                    menteeGoals: session.mentee_goals || '',
                    mentor: mentor, // Link back to mentor
                    mentee: mentee, // Link back to mentee
                    rating: feedbackRating,
                    feedback: feedbackComment,
                    hasFeedback: !!feedbackData,
                    mentorSurvey: mentorSurvey,
                    video_link: session.video_link,
                    notes: session.notes,
                    created_at: session.created_at,
                    updated_at: session.updated_at
                };
            });

            return {
                id: item.id,
                mentor,
                mentee,
                status: item.status as MentorshipStatus,
                sessions,
                startDate: item.start_date,
                terminationReason: item.termination_reason
            };
        });

    } catch (err) {
        console.error('Unexpected error fetching mentorships:', err);
        return [];
    }
};

export const fetchActiveMentorshipsForUser = async (userId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('mentorships')
            .select('mentor_id')
            .eq('mentee_id', userId)
            .eq('status', 'active');

        if (error) {
            console.error('Error fetching active mentorships:', error);
            return [];
        }

        return (data || []).map((m: any) => m.mentor_id);
    } catch (err) {
        console.error('Unexpected error fetching active mentorships:', err);
        return [];
    }
};

export const fetchMentees = async (): Promise<Mentee[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, 
                first_name, 
                last_name, 
                email, 
                role, 
                avatar_url,
                mentee_profiles (
                    title, 
                    company, 
                    bio, 
                    pronouns, 
                    neurodivergence_details,
                    is_neurodivergent, 
                    mentorship_goals
                ),
                availability_blocks (
                    day_of_week, 
                    start_time, 
                    end_time
                )
            `)
            .eq('role', 'mentee');

        if (error) {
            console.error('Error fetching mentees:', error);
            return [];
        }

        if (!data) return [];

        return data.map((user: any) => {
            const profile = Array.isArray(user.mentee_profiles) ? user.mentee_profiles[0] : user.mentee_profiles || {};

            // Map availability
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
                id: user.id,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Mentoreada',
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: 'mentee',
                avatarUrl: user.avatar_url || '',
                interests: [], // Not fetched
                availability: availability,
                bio: profile.bio || '',
                title: profile.title || 'Estudiante',
                company: profile.company || '',
                mentorshipGoals: profile.mentorship_goals || [],
                pronouns: profile.pronouns,
                neurodivergence: profile.neurodivergence_details,
                isNeurodivergent: profile.is_neurodivergent || false
            };
        });
    } catch (err) {
        console.error('Unexpected error fetching mentees:', err);
        return [];
    }
};
export const updateSessionStatus = async (sessionId: number, newStatus: SessionStatus): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('sessions')
            .update({ status: newStatus })
            .eq('id', sessionId);

        if (error) {
            console.error('Error updating session status:', error);
            throw error;
        }
        return true;
    } catch (err) {
        console.error('Unexpected error updating session status:', err);
        return false;
    }
};

const mapQualityToScore = (quality: string): number => {
    switch (quality) {
        case 'excellent': return 4;
        case 'good': return 3;
        case 'average': return 2;
        case 'poor': return 1;
        default: return 0;
    }
};

export const completeSessionWithSurvey = async (
    sessionId: number,
    mentorId: string | number,
    survey: MentorSurvey
): Promise<boolean> => {
    try {
        // 1. Actualizar el estado de la sesión a 'completed'
        const { error: sessionError } = await supabase
            .from('sessions')
            .update({ status: 'completed' })
            .eq('id', sessionId);

        if (sessionError) throw sessionError;

        // 2. Insertar la encuesta privada
        // Nota: Mapeamos el campo 'outcome' (texto del modal) al campo 'notes' de la BD
        // y usamos valores numéricos para preparation y engagement.
        const { error: surveyError } = await supabase
            .from('private_session_surveys')
            .insert([{
                session_id: sessionId,
                mentor_id: mentorId,
                preparation: mapQualityToScore(survey.preparation),
                engagement: mapQualityToScore(survey.engagement),
                outcome: 0, // Valor por defecto si no se usa numérico
                notes: survey.outcome // Guardamos el texto del resultado aquí
            }]);

        if (surveyError) throw surveyError;
        // 3. Actualizar el rating de la mentora

        const { data: relData } = await supabase
             .from('sessions')
             .select(`
                mentorship:mentorships ( mentee_id )
             `)
             .eq('id', sessionId)
             .single();
        const menteeId = (relData?.mentorship as any)?.mentee_id;

        if (menteeId) {
            // Llamada asíncrona (no bloqueamos el retorno true)
            ratingService.updateMenteeRating(menteeId); 
        }

        return true;
    } catch (err) {
        console.error('Error completing session:', err);
        return false;
    }
};

export const submitSessionFeedback = async (sessionId: number, rating: number, comment: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('session_feedback')
            .insert({
                session_id: sessionId,
                reviewer_id: user.id,
                rating,
                comment,
            });

        if (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
        // Actualizar el rating de la mentora
        const { data: relData } = await supabase
             .from('sessions')
             .select(`
                mentorship:mentorships ( mentor_id )
             `)
             .eq('id', sessionId)
             .single();

        const mentorId = (relData?.mentorship as any)?.mentor_id;

        if (mentorId) {
            ratingService.updateMentorRating(mentorId);
        }

        return true;
    } catch (err) {
        console.error('Unexpected error submitting feedback:', err);
        return false;
    }
};

