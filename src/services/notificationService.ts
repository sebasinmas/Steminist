import { supabase } from "@/lib/supabase";

export interface Notifications {
    "sessions": sessionNotification[];
    "connectionRequests": connectionRequest[];
}
export interface sessionNotification {
    id: number;
    avatarUrl: string;
    userName: string;
    topic: string;
    scheduledAt: Date;
}
export interface connectionRequest {
    menteeId: number;
    avatarUrl: string;
    menteeName: string;
    message: string;
}

export const notificationService = {

    fetchNotifications: async (userId: string | number, role: string): Promise<Notifications> => {
        let dictionary: Notifications = {
            "sessions": [],
            "connectionRequests": []
        };
        switch (role) {
            case "mentor":
                dictionary["sessions"] = await notificationService.fetchSessionsMentor(userId);
                dictionary["connectionRequests"] = await notificationService.fetchConnectionRequests(userId);
                break;
            case "mentee":
                dictionary["sessions"] = await notificationService.fetchSessionsMentee(userId);
                break;
            default:
                break;
        }
        return dictionary;
    },

    fetchSessionsMentee: async (menteeId: string | number): Promise<sessionNotification[]> => {
        let sessions: sessionNotification[] = [];
        const { data, error } = await supabase.
            from('sessions')
            .select(`id, mentorships:mentorship_id(mentee_profiles:mentee_id(users:user_id(first_name, last_name,avatar_url))), topic, status, scheduled_at`)
            .eq('mentorships.mentee_id', menteeId)
            .in('status', ['pending', 'needs_confirmation'])
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching mentor sessions notifications:', error);
            return [];
        }
        if (!data) return [];
        data.forEach((session: any) => {
            sessions.push({
                id: session.id,
                avatarUrl: session.mentorships.mentee_profiles.users.avatar_url,
                userName: `${session.mentorships.mentee_profiles.users.first_name} ${session.mentorships.mentee_profiles.users.last_name}`.trim() || 'No se encontró nombre',
                topic: session.topic,
                scheduledAt: new Date(session.scheduled_at)
            })
        });
        return sessions;
    },
    // Funciones auxiliares para obtener notificaciones específicas
    fetchSessionsMentor: async (mentorId: string | number): Promise<sessionNotification[]> => {
        let sessions: sessionNotification[] = [];
        const { data, error } = await supabase.
            from('sessions')
            .select(`id, mentorships:mentorship_id(mentee_profiles:mentee_id(users:user_id(first_name, last_name,avatar_url))), topic, status, scheduled_at`)
            .eq('mentorships.mentor_id', mentorId)
            .in('status', ['pending', 'needs_confirmation'])
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching mentor sessions notifications:', error);
            return [];
        }
        if (!data) return [];
        data.forEach((session: any) => {
            sessions.push({
                id: session.id,
                avatarUrl: session.mentorships.mentee_profiles.users.avatar_url,
                userName: `${session.mentorships.mentee_profiles.users.first_name} ${session.mentorships.mentee_profiles.users.last_name}`.trim() || 'No se encontró nombre',
                topic: session.topic,
                scheduledAt: new Date(session.scheduled_at)
            })
        });
        return sessions;
    },

    fetchConnectionRequests: async (mentorId: string | number): Promise<connectionRequest[]> => {
        let requests: connectionRequest[] = [];
        const { data, error } = await supabase.
        from('connection_requests')
        .select(`id, motivation_letter, users:mentee_id(avatar_url, first_name, last_name)`)
        .eq('mentor_id', mentorId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching connection requests notifications:', error);
            return [];
        }
        data.forEach((data: any) => {
            requests.push({
                menteeId: data.id,
                avatarUrl: data.users.avatar_url,
                menteeName: `${data.users.first_name} ${data.users.last_name}`.trim() || 'No se encontró nombre',
                message: data.motivation_letter || 'No se encontró mensaje'
            })
        });
        return requests;

    }


}

