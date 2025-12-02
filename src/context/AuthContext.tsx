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

    const fetchUserProfile = async (sessionUser: any) => {
        try {
            // Fetch full profile from models.users
            const { data: profile, error } = await supabase
                .schema('models')
                .from('users')
                .select('id, email, first_name, last_name, role, avatar_url, mentee_profiles(interests, mentorship_goals), mentor_profiles(interests, mentorship_goals, bio, title, company), availability_blocks(day_of_week, start_time, end_time)')
                .eq('id', sessionUser.id)
                .single();

            if (error) {
                // If row not found (PGRST116), it might be a new user or not yet created in the table.
                // We fallback to session metadata.
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching user profile:', error);
                }
            }

            const metadata = sessionUser.user_metadata || {};

            // Helper to extract profile data
            const menteeProfile = profile?.mentee_profiles ? (Array.isArray(profile.mentee_profiles) ? profile.mentee_profiles[0] : profile.mentee_profiles) : null;
            const mentorProfile = profile?.mentor_profiles ? (Array.isArray(profile.mentor_profiles) ? profile.mentor_profiles[0] : profile.mentor_profiles) : null;

            // Prioritize specific profile tables for interests/goals
            const interests = menteeProfile?.interests || mentorProfile?.interests || metadata.interests || [];
            const mentorshipGoals = menteeProfile?.mentorship_goals || mentorProfile?.mentorship_goals || metadata.mentorshipGoals || [];
            const bio = mentorProfile?.bio || metadata.bio || '';
            const title = mentorProfile?.title || metadata.title || '';
            const company = mentorProfile?.company || metadata.company || '';

            // Map availability_blocks to Availability object
            const availability: { [key: string]: string[] } = {};
            if (profile?.availability_blocks && Array.isArray(profile.availability_blocks)) {
                profile.availability_blocks.forEach((block: any) => {
                    const day = block.day_of_week.toLowerCase();
                    const timeRange = `${block.start_time.slice(0, 5)}-${block.end_time.slice(0, 5)}`;
                    if (!availability[day]) {
                        availability[day] = [];
                    }
                    availability[day].push(timeRange);
                });
            }

            // Merge session metadata with DB profile
            // DB profile takes precedence for fields that exist there
            const mergedUser = {
                id: sessionUser.id,
                email: sessionUser.email || '',
                name: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : (metadata.name || sessionUser.email?.split('@')[0] || 'User'),
                role: (profile?.role || metadata.role || 'mentee') as UserRole,
                avatarUrl: profile?.avatar_url || metadata.avatarUrl || 'https://via.placeholder.com/150',
                interests: interests,
                availability: availability,
                mentorshipGoals: mentorshipGoals,
                bio: bio,
                title: title,
                company: company,
                // Add other fields from profile if needed
                ...profile,
                ...metadata // metadata might have some extra fields not in DB yet
            } as User;

            return mergedUser;

        } catch (err) {
            console.error('Unexpected error in fetchUserProfile:', err);
            return null;
        }
    };

    useEffect(() => {
        // Check active session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const fullUser = await fetchUserProfile(session.user);
                setUser(fullUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        initSession();

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const fullUser = await fetchUserProfile(session.user);
                setUser(fullUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password?: string) => {
        try {
            await authService.login(email, password);
            // State update handled by onAuthStateChange
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            // Force clear local storage to ensure token is gone
            localStorage.removeItem('sb-access-token');
            localStorage.removeItem('sb-refresh-token');
            // Also clear any other app-specific keys if necessary
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
            // Even if API fails, force client-side logout
            setUser(null);
            localStorage.clear();
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