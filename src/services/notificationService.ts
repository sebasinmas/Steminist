import { supabase } from "@/lib/supabase";
import { Session } from "@/types";



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