import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import type { UserRole, User } from '../types';

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    register: (data: any, role: 'mentee' | 'mentor') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchingProfileRef = React.useRef<Set<string>>(new Set()); // Track ongoing fetches

    // Helper function to create a fallback user from session metadata
    const createFallbackUser = (sessionUser: any): User => {
        const metadata = sessionUser.user_metadata || {};
        const role = (metadata.role || 'mentee') as UserRole;
        
        // Create base user object
        const baseUser = {
            id: sessionUser.id,
            name: metadata.name || sessionUser.email?.split('@')[0] || 'User',
            email: sessionUser.email || '',
            role: role,
            avatarUrl: metadata.avatarUrl || 'https://via.placeholder.com/150',
            interests: metadata.interests || [],
            availability: metadata.availability || {},
        };

        // Return as User type (union type, so we cast it)
        return baseUser as User;
    };

    const fetchUserProfile = async (sessionUser: any) => {
        const userId = sessionUser.id;
        
        // Prevent duplicate concurrent fetches for the same user
        if (fetchingProfileRef.current.has(userId)) {
            console.log('⏭️ [AuthContext] Ya hay una consulta en curso para este usuario, omitiendo...');
            return null;
        }
        
        fetchingProfileRef.current.add(userId);
        const startTime = performance.now();
        console.log('🔍 [AuthContext] Iniciando fetchUserProfile para usuario:', userId);
        
        try {
            // Fetch full profile from models.users
            console.log('📡 [AuthContext] Consultando base de datos...');
            const { data: profile, error } = await supabase
                .schema('models')
                .from('users')
                .select('id, email, first_name, last_name, role, avatar_url, mentee_profiles(interests, mentorship_goals), mentor_profiles(interests, mentorship_goals, bio, title, company), availability_blocks(day_of_week, start_time, end_time)')
                .eq('id', sessionUser.id)
                .single();

            const elapsedTime = performance.now() - startTime;
            
            if (error) {
                // If row not found (PGRST116), it might be a new user or not yet created in the table.
                // We fallback to session metadata.
                if (error.code === 'PGRST116') {
                    console.log(`⚠️ [AuthContext] Usuario no encontrado en DB (${elapsedTime.toFixed(2)}ms) - Usando metadata de sesión`);
                } else {
                    console.error(`❌ [AuthContext] Error fetching user profile (${elapsedTime.toFixed(2)}ms):`, error);
                }
            } else {
                console.log(`✅ [AuthContext] Perfil obtenido exitosamente (${elapsedTime.toFixed(2)}ms)`, {
                    hasProfile: !!profile,
                    hasMenteeProfile: !!profile?.mentee_profiles,
                    hasMentorProfile: !!profile?.mentor_profiles,
                    hasAvailability: !!profile?.availability_blocks
                });
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

            const totalTime = performance.now() - startTime;
            console.log(`✨ [AuthContext] Usuario mergeado completado (${totalTime.toFixed(2)}ms total)`);
            fetchingProfileRef.current.delete(userId);
            return mergedUser;

        } catch (err) {
            const errorTime = performance.now() - startTime;
            console.error(`💥 [AuthContext] Error inesperado en fetchUserProfile (${errorTime.toFixed(2)}ms):`, err);
            fetchingProfileRef.current.delete(userId);
            return null;
        }
    };

    useEffect(() => {
        // Check active session - FAST path: set user immediately from session, then fetch full profile
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Error getting session:', error);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    // IMMEDIATELY set user from session metadata (fast, no DB call)
                    console.log('⚡ [AuthContext] Estableciendo usuario básico desde sesión (instantáneo)');
                    const fallbackUser = createFallbackUser(session.user);
                    setUser(fallbackUser);
                    setLoading(false); // Set loading to false immediately so app can render
                    console.log('✅ [AuthContext] Loading completado, app puede renderizar');
                    
                    // Then, in the background, try to fetch full profile
                    // This doesn't block the UI
                    console.log('🔄 [AuthContext] Iniciando carga de perfil completo en segundo plano...');
                    fetchUserProfile(session.user)
                        .then((fullUser) => {
                            if (fullUser) {
                                console.log('📝 [AuthContext] Actualizando usuario con perfil completo');
                                setUser(fullUser); // Update with full profile if available
                            } else {
                                // fullUser is null only if fetch was skipped (duplicate) or failed
                                // If it was skipped, the original fetch will update the user
                                // If it failed, we keep the fallback user
                                console.log('ℹ️ [AuthContext] Consulta omitida o fallida, manteniendo usuario actual');
                            }
                        })
                        .catch((err) => {
                            console.error('❌ [AuthContext] Error fetching user profile (non-blocking):', err);
                            // Keep using fallback user, no need to update
                        });
                } else {
                    setUser(null);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Unexpected error in initSession:', err);
                setUser(null);
                setLoading(false);
            }
        };

        initSession();

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                if (session?.user) {
                    // Set user immediately from session (fast)
                    console.log('🔄 [AuthContext] Auth state change - estableciendo usuario básico');
                    const fallbackUser = createFallbackUser(session.user);
                    setUser(fallbackUser);
                    setLoading(false);
                    
                    // Then fetch full profile in background (non-blocking)
                    fetchUserProfile(session.user)
                        .then((fullUser) => {
                            if (fullUser) {
                                console.log('📝 [AuthContext] Auth state change - actualizando con perfil completo');
                                setUser(fullUser);
                            }
                        })
                        .catch((err) => {
                            console.error('❌ [AuthContext] Error fetching user profile in auth state change (non-blocking):', err);
                        });
                } else {
                    setUser(null);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Unexpected error in auth state change:', err);
                setUser(null);
                setLoading(false);
            }
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
            loading,
            login,
            logout,
            register,
        };
    }, [user, loading]);

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