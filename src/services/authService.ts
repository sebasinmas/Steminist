import { supabase } from '../lib/supabase';

interface LoginResponse {
  user: any | null;   // Supabase Auth user (no tu tipo User)
  session: any;
  error?: any;
}

export const authService = {
  // LOGIN: solo autenticación, sin mapear al modelo de tu app
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      user: data.user,     // Usuario de Supabase Auth
      session: data.session,
    };
  },

  // REGISTER: solo creación en Auth.
  // La inserción en models.users y profiles la hace AuthContext.register
  register: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    return user;
  },

  // UPDATE PROFILE (Opcional):
  // Úsalo SOLO si quieres cambiar campos de Auth (p.ej. email/password).
  // Para nombre, bio, intereses, etc. usa directamente updates en tus tablas models.*
  updateProfile: async (updates: {
    email?: string;
    password?: string;
  }) => {
    const payload: any = {};

    if (updates.email) {
      payload.email = updates.email;
    }
    if (updates.password) {
      payload.password = updates.password;
    }

    const { data, error } = await supabase.auth.updateUser(payload);

    if (error) throw error;
    return data.user;
  },
};