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
    return data.map((req: any) => {
        const menteeProfile = Array.isArray(req.mentee.mentee_profiles) ? req.mentee.mentee_profiles[0] : req.mentee.mentee_profiles;
        const mentorProfile = Array.isArray(req.mentor.mentor_profiles) ? req.mentor.mentor_profiles[0] : req.mentor.mentor_profiles;

        return {
            id: req.id,
            status: req.status,
            motivationLetter: req.motivation_letter,
            mentee: {
                id: req.mentee.id,
                name: `${req.mentee.first_name} ${req.mentee.last_name}`.trim(),
                avatarUrl: req.mentee.avatar_url,
                title: menteeProfile?.title,
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
                maxMentees: mentorProfile?.max_mentees || 3,
                // Campos mínimos
                email: req.mentor.email,
                role: 'mentor',
                avatarUrl: req.mentor.avatar_url,
                interests: [],
                availability: {},
                title: mentorProfile?.title,
                company: mentorProfile?.company,
                rating: 0, reviews: 0, longBio: '', mentorshipGoals: []
            }
        };
    }) as unknown as ConnectionRequest[];
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
    const sessions: Session[] = data.map((session: any) => {
        const raw = session.scheduled_at as string | null;
        const rawMentor = session.mentorship?.mentor;
        const rawMentee = session.mentorship?.mentee;

        let dateStr = '';
        let timeStr = '00:00';

        if (raw) {
            const d = new Date(raw);
            // Usamos UTC para respetar exactamente lo que viene de la BD
            const year = d.getUTCFullYear();
            const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = d.getUTCDate().toString().padStart(2, '0');
            const hours = d.getUTCHours().toString().padStart(2, '0');
            const minutes = d.getUTCMinutes().toString().padStart(2, '0');

            dateStr = `${year}-${month}-${day}`; // 2025-12-19
            timeStr = `${hours}:${minutes}`;     // 12:00
        }

        return {
            id: session.id,
            sessionNumber: session.session_number,
            date: dateStr,
            time: timeStr,
            duration: session.duration_minutes,
            status: session.status,
            topic: session.topic,
            menteeGoals: session.mentee_goals,
            mentor: rawMentor
                ? {
                    ...rawMentor,
                    name: `${rawMentor.first_name || ''} ${rawMentor.last_name || ''}`.trim(),
                    avatarUrl: rawMentor.avatar_url || '',
                }
                : undefined,
            mentee: rawMentee
                ? {
                    ...rawMentee,
                    name: `${rawMentee.first_name || ''} ${rawMentee.last_name || ''}`.trim(),
                    avatarUrl: rawMentee.avatar_url || '',
                }
                : undefined,
        } as Session;
    });
    console.log("Si lees esto, se obtuvieron sesiones:", sessions);
    return sessions;
};