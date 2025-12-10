import { supabase } from '../lib/supabase';
import type { ConnectionRequest } from '../types';

export const connectionService = {
    // Crear una nueva solicitud de conexión
    createRequest: async (
        menteeId: string | number,
        mentorId: string | number,
        motivationLetter: string,
        interests: string[] = [],
        motivations: string[] = [],
    ) => {
        const { data, error } = await supabase
            .from('connection_requests')
            .insert([
                {
                    mentee_id: menteeId,
                    mentor_id: mentorId,
                    motivation_letter: motivationLetter,
                    interest: interests,
                    motivation: motivations,
                    status: 'pending', // El valor por defecto en DB es pending, pero es bueno ser explícito
                },
            ])
            .select(`
                *,
                mentee:users!mentee_id(id, first_name, last_name, avatar_url, email),
                mentor:users!mentor_id(id, first_name, last_name, avatar_url, email)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    // Verificar si ya existe una conexión entre dos usuarios
    checkConnectionStatus: async (menteeId: string | number, mentorId: string | number) => {
        const { data, error } = await supabase
            .from('connection_requests')
            .select('status')
            .eq('mentee_id', menteeId)
            .eq('mentor_id', mentorId)
            .maybeSingle(); // Usamos maybeSingle porque puede que no exista conexión aún

        if (error) throw error;
        return data ? data.status : 'none';
    },

    fetchPendingRequests: async (): Promise<ConnectionRequest[]> => {
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
            .eq('status', 'pending');

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
    },

    // Actualizar estado (Aceptar/Rechazar)
    updateRequestStatus: async (requestId: number, status: 'accepted' | 'declined') => {
        const { data, error } = await supabase
            .from('connection_requests')
            .update({ 
                status: status,
                responded_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

};