import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import type { UserRole, User } from '../types';

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isLoggedIn: boolean;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    register: (data: any, role: 'mentee' | 'mentor') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(mapSessionToUser(session));
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(mapSessionToUser(session));
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const mapSessionToUser = (session: any): User | null => {
        if (!session?.user) return null;
        const { user: sbUser } = session;
        const metadata = sbUser.user_metadata || {};

        // Lógica para construir el nombre completo
        const firstName = metadata.first_name || '';
        const lastName = metadata.last_name || '';
        const fullName = (firstName && lastName)
            ? `${firstName} ${lastName}`
            : (metadata.name || sbUser.email?.split('@')[0] || 'User');

        return {
            id: sbUser.id,
            name: fullName, // Combinamos para visualización
            first_name: firstName,
            last_name: lastName,
            email: sbUser.email || '',
            role: metadata.role || sbUser.app_metadata?.role || 'mentee',
            avatarUrl: metadata.avatarUrl || 'https://via.placeholder.com/150',
            interests: metadata.interests || [],
            availability: metadata.availability || {},
            ...metadata
        } as User;
    };

    const login = async (email: string, password?: string) => {
        try {
            await authService.login(email, password);
            // State update handled by onAuthStateChange
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            // State update handled by onAuthStateChange
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const register = async (data: any, role: 'mentee' | 'mentor') => {
        try {
            await authService.register(data.email, data.password || 'password123', data, role);
            // State update handled by onAuthStateChange
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    };

    const value = useMemo(() => {
        let role: UserRole | null = null;
        if (user) {
            if (user.role) role = user.role;
            else if ('reviews' in user) role = 'mentor';
            else if ('mentorshipGoals' in user) role = 'mentee';
            else if (user.name === 'Admin User') role = 'admin';
        }

        return {
            user,
            role,
            isLoggedIn: !!user,
            login,
            logout,
            register,
        };
    }, [user]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};