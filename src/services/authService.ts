import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface LoginResponse {
    user: User | null;
    session: any;
    error?: any;
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password,
        });
        // Map Supabase user to our User type
        const sbUser = data.user;
        const metadata = sbUser?.user_metadata || {};

        const user: any = {
            id: sbUser?.id,
            name: metadata.name || email.split('@')[0],
            email: email,
            role: metadata.role || 'mentee',
            avatarUrl: metadata.avatarUrl || 'https://via.placeholder.com/150',
            // Default fields to avoid crashes
            expertise: [],
            availability: {},
        };

        return { user, session: data.session };
    },

    register: async (email: string, password: string, data: any, role: UserRole) => {
        const { data: authData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: data.name,
                    role: role,
                    ...data
                }
            }
        });

        if (error) throw error;
        return authData;
    },

    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    getUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};
