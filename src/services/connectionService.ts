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
    }
};