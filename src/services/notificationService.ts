import { supabase } from "@/lib/supabase";
import { ConnectionRequest, Mentee, Session } from "@/types";



export const getConnectionRequestsForMentor = async (mentorId: string | number) => {
    const { data, error } = await supabase
        .from('connection_requests')
        .select(`
                id,
                motivation_letter,
                status,
                mentee:users!mentee_id (
                    id, first_name, last_name, avatar_url, email,
                    mentee_profiles (title, company)
                ),
                mentor:users!mentor_id (
                    id, first_name, last_name, avatar_url, email,
                    mentor_profiles (title, company, max_mentees)
                )
            `)
        .eq('mentor_id', mentorId)          // Condición 1: Que sea para mí
        .eq('status', 'pending_mentor');

    if (error) throw error;

    // Mapear respuesta a tipo ConnectionRequest
    return data.map((req: any) => ({
        id: req.id,
        status: req.status,
        motivationLetter: req.motivation_letter,
        mentee: {
            id: req.mentee.id,
            name: `${req.mentee.first_name} ${req.mentee.last_name}`.trim(),
            avatarUrl: req.mentee.avatar_url,
            title: req.mentee.mentee_profiles?.[0]?.title,
            // Campos mínimos necesarios para la UI
            email: req.mentee.email,
            role: 'mentee',
            interests: [],
            availability: {},
            bio: '',
            mentorshipGoals: []
        },
        mentor: {
            id: req.mentor.id,
            name: `${req.mentor.first_name} ${req.mentor.last_name}`.trim(),
            maxMentees: req.mentor.mentor_profiles?.[0]?.max_mentees || 3,
            // Campos mínimos
            email: req.mentor.email,
            role: 'mentor',
            avatarUrl: req.mentor.avatar_url,
            interests: [],
            availability: {},
            title: req.mentor.mentor_profiles?.[0]?.title,
            company: req.mentor.mentor_profiles?.[0]?.company,
            rating: 0, reviews: 0, longBio: '', mentorshipGoals: []
        }
    })) as unknown as ConnectionRequest[];
}

export const getPendingSessionsForUser = async (userId: string | number): Promise<Session[]> => {
    console.log("Se intentará obtener sesiones pendientes para el usuario con ID:", userId);
    const { data, error } = await supabase
        .from('sessions')
        .select(`
            id, session_number, scheduled_at, duration_minutes, status, topic, mentee_goals,
            mentorship:mentorship_id!inner (
                mentor:mentor_id (id, first_name, last_name, avatar_url, email),
                mentee:mentee_id (id, first_name, last_name, avatar_url, email)
            )
        `)
        // Aquí está la magia:
        // 1. Buscamos mentee_id = userId O mentor_id = userId
        // 2. Le decimos a Supabase que esta lógica aplica a la tabla foránea 'mentorship'
        .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`, {
            foreignTable: 'mentorship'
        });

    if (error) {
        console.error("Error fetching sessions que asco:", error);
        throw error;
    }

    if (!data) return [];

    // Mapeo de datos (adapter pattern)
    const sessions: Session[] = data.map((session: any) => ({
        id: session.id,
        sessionNumber: session.session_number,
        date: session.scheduled_at,
        time: new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: session.duration_minutes,
        status: session.status,
        topic: session.topic,
        menteeGoals: session.mentee_goals,
        mentor: session.mentorship?.mentor,
        mentee: session.mentorship?.mentee
    }));
    console.log("Si lees esto, se obtuvieron sesiones:", sessions);
    return sessions;
};