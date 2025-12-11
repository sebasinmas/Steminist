import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useMemo,
    useEffect,
} from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import type { UserRole, User, Mentor, Mentee, AdminUser } from '../types';

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    register: (data: any, role: 'mentee' | 'mentor') => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------- HELPERS DE ACCESO A SUPABASE (SCHEMA MODELS) ---------------- //

async function fetchUserBase(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select(
            'id, email, role, avatar_url, timezone, first_name, last_name, created_at, updated_at',
        )
        .eq('id', userId)
        .maybeSingle(); // evita romper si aún no existe fila

    if (error) throw error;
    return data;
}

async function fetchMentorProfile(userId: string) {
    const { data, error } = await supabase
        .from('mentor_profiles')
        .select(
            'title, company, bio, interests, mentorship_goals, expertise, max_mentees, average_rating, total_reviews, paper_link',
        )
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchPapers(userId: string) {
    const { data, error } = await supabase
        .from('papers')
        .select('title, link, user_id')
        .eq('user_id', userId)
        .order('id', { ascending: true });

    if (error) {
        console.error('[AuthContext] fetchPapers error', error);
        throw error;
    }

    console.log('[AuthContext] fetchPapers data', data);
    return data || [];
}

async function fetchMenteeProfile(userId: string) {
    const { data, error } = await supabase
        .from('mentee_profiles')
        .select(
            'title, company, bio, interests, mentorship_goals, pronouns, is_neurodivergent, neurodivergence_details',
        )
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchAvailability(userId: string) {
    const { data, error } = await supabase
        .from('availability_blocks')
        .select('specific_date, day_of_week, start_time')
        .eq('user_id', userId)
        .eq('is_booked', false); // opcional: solo slots no reservados

    if (error) throw error;

    // availability: { "YYYY-MM-DD": ["HH:MM", ...], "monday": ["HH:MM", ...] }
    const availability: { [key: string]: string[] } = {};

    (data || []).forEach((block: any) => {
        // Use specific_date if present, otherwise use day_of_week (recurring)
        const dateKey: string = block.specific_date || block.day_of_week?.toLowerCase();

        if (!dateKey) return;

        // start_time viene como "HH:MM:SS" -> "HH:MM"
        const time = block.start_time.slice(0, 5);

        if (!availability[dateKey]) {
            availability[dateKey] = [];
        }
        if (!availability[dateKey].includes(time)) {
            availability[dateKey].push(time);
        }
    });

    // Ordenar las horas en cada fecha/día
    Object.keys(availability).forEach(key => {
        availability[key].sort();
    });

    return availability;
}

// ---------------- BUILDERS TIPADOS (SIN CASTS PELIGROSOS) ---------------- //

function buildAdminUserFromRow(row: any): AdminUser {
    const firstName: string = row?.first_name ?? '';
    const lastName: string = row?.last_name ?? '';
    const fullName =
        `${firstName} ${lastName}`.trim() ||
        row?.email?.split('@')[0] ||
        'Usuario';

    return {
        id: row.id,
        name: fullName,
        email: row.email,
        role: 'admin',
        avatarUrl: row.avatar_url || 'https://via.placeholder.com/150',
        interests: [],
        company: '',
        title: '',
    };
}

function buildMentorUser(base: any, profile: any | null): Mentor {
    const firstName: string = base?.first_name ?? '';
    const lastName: string = base?.last_name ?? '';
    const fullName =
        `${firstName} ${lastName}`.trim() ||
        base?.email?.split('@')[0] ||
        'Mentora';

    return {
        id: base.id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        email: base.email,
        role: 'mentor',
        avatarUrl: base.avatar_url || 'https://via.placeholder.com/150',

        interests: profile?.interests ?? [],
        availability: {},

        company: profile?.company ?? '',
        title: profile?.title ?? '',
        experience: undefined,
        timezone: base.timezone ?? undefined,
        motivations: [],

        rating: profile?.average_rating ?? 0,
        reviews: profile?.total_reviews ?? 0,

        longBio: profile?.bio ?? '',
        mentorshipGoals: profile?.mentorship_goals ?? [],
        maxMentees: profile?.max_mentees ?? 3,

        // links se inyectará después desde fetchPapers
        links: [],
    };
}

function buildMenteeUser(base: any, profile: any | null): Mentee {
    const firstName: string = base?.first_name ?? '';
    const lastName: string = base?.last_name ?? '';
    const fullName =
        `${firstName} ${lastName}`.trim() ||
        base?.email?.split('@')[0] ||
        'Mentoreada';

    return {
        id: base.id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        email: base.email,
        role: 'mentee',
        avatarUrl: base.avatar_url || 'https://via.placeholder.com/150',

        interests: profile?.interests ?? [],
        availability: {},

        company: profile?.company ?? '',
        title: profile?.title ?? '',
        timezone: base.timezone ?? undefined,
        motivations: [],

        bio: profile?.bio ?? '',
        mentorshipGoals: profile?.mentorship_goals ?? [],
        pronouns: profile?.pronouns ?? '',
        neurodivergence: profile?.neurodivergence_details ?? '',
    };
}

// Enriquecer usuario desde el schema relacional según su rol
async function enrichUserFromSchema(userId: string): Promise<User | null> {
    const baseUserRow = await fetchUserBase(userId);
    if (!baseUserRow) {
        return null;
    }

    const role = (baseUserRow.role || 'mentee') as UserRole;

    if (role === 'mentor') {
        const [mentorProfile, availability, papers] = await Promise.all([
            fetchMentorProfile(userId),
            fetchAvailability(userId),
            fetchPapers(userId),
        ]);

        const baseMentor = buildMentorUser(baseUserRow, mentorProfile);

        const links = papers.map((p: any) => ({
            title: p.title || 'Publicación',
            url: p.link || '',
        }));

        return { ...baseMentor, availability, links };
    }

    if (role === 'mentee') {
        const [menteeProfile, availability] = await Promise.all([
            fetchMenteeProfile(userId),
            fetchAvailability(userId),
        ]);
        const baseMentee = buildMenteeUser(baseUserRow, menteeProfile);
        return { ...baseMentee, availability };
    }

    return buildAdminUserFromRow(baseUserRow);
}

// ---------------------- PROVIDER ---------------------- //

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
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

    const fetchUserProfile = async (sessionUser: any): Promise<User | null> => {
        const userId = sessionUser.id;

        // Evitar llamadas duplicadas en paralelo
        if (fetchingProfileRef.current.has(userId)) {
            console.log('⏭️ [AuthContext] Ya hay una consulta en curso para este usuario, omitiendo...');
            return null;
        }

        fetchingProfileRef.current.add(userId);
        const startTime = performance.now();
        console.log('🔍 [AuthContext] Iniciando fetchUserProfile para usuario:', userId);

        try {
            // 1) Leer fila base de public.users
            const baseUserRow = await fetchUserBase(userId);
            if (!baseUserRow) {
                const elapsedTime = performance.now() - startTime;
                console.log(
                    `⚠️ [AuthContext] Usuario no encontrado en public.users (${elapsedTime.toFixed(
                        2,
                    )}ms)`,
                );
                fetchingProfileRef.current.delete(userId);
                return null;
            }

            // 2) Según rol, leer perfil extendido + availability (+ papers para mentor) y construir User tipado
            const role = (baseUserRow.role || 'mentee') as UserRole;
            let fullUser: User;

            if (role === 'mentor') {
                const [mentorProfile, availability, papers] = await Promise.all([
                    fetchMentorProfile(userId),
                    fetchAvailability(userId),
                    fetchPapers(userId),
                ]);

                const baseMentor = buildMentorUser(baseUserRow, mentorProfile);

                const links = papers.map((p: any) => ({
                    title: p.title || 'Publicación',
                    url: p.link || '',
                }));

                fullUser = { ...baseMentor, availability, links };
            } else if (role === 'mentee') {
                const [menteeProfile, availability] = await Promise.all([
                    fetchMenteeProfile(userId),
                    fetchAvailability(userId),
                ]);
                const baseMentee = buildMenteeUser(baseUserRow, menteeProfile);
                fullUser = { ...baseMentee, availability };
            } else {
                fullUser = buildAdminUserFromRow(baseUserRow);
            }

            const totalTime = performance.now() - startTime;
            console.log(
                `✨ [AuthContext] Usuario completo construido (${totalTime.toFixed(2)}ms total)`,
                fullUser,
            );
            fetchingProfileRef.current.delete(userId);
            return fullUser;
        } catch (err) {
            const errorTime = performance.now() - startTime;
            console.error(
                `💥 [AuthContext] Error inesperado en fetchUserProfile (${errorTime.toFixed(
                    2,
                )}ms):`,
                err,
            );
            fetchingProfileRef.current.delete(userId);
            return null;
        }
    };

    // helper público para refrescar el usuario desde fuera
    const refreshUser = async () => {
        console.log('[AuthContext] refreshUser start');
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        console.log('[AuthContext] getSession result', { session, sessionError });

        if (sessionError) {
            console.error('[AuthContext] getSession error', sessionError);
            throw sessionError;
        }

        if (session?.user) {
            console.log('[AuthContext] calling enrichUserFromSchema', session.user.id);
            const fullUser = await enrichUserFromSchema(session.user.id);
            console.log('[AuthContext] enrichUserFromSchema done', fullUser);
            setUser(fullUser);
        } else {
            console.log('[AuthContext] no session.user, setting user null');
            setUser(null);
        }

        console.log('[AuthContext] refreshUser end');
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

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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
        // 1) Crear en Auth
        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });
        if (error) throw error;

        const userId =
            authData?.user?.id || (await supabase.auth.getUser()).data.user?.id;

        if (!userId) {
            throw new Error('No se pudo obtener el ID del usuario después del registro');
        }

        // 2) Crear fila en models.users (vía view public.users)
        const { error: baseErr } = await supabase.from('users').insert({
            id: userId,
            email: data.email,
            role,
            first_name: data.first_name,
            last_name: data.last_name,
            avatar_url: null,
            timezone: data.timezone || null,
        });

        if (baseErr) throw baseErr;

        // 3) Crear perfil extendido según rol
        if (role === 'mentor') {
            const { error: mentorErr } = await supabase.from('mentor_profiles').insert({
                user_id: userId,
                title: data.title || '',
                company: data.company || '',
                bio: data.bio || '',
                interests: data.interests || [],
                mentorship_goals: data.mentorshipGoals || [],
                expertise: data.experience || null,
                max_mentees: data.maxMentees || 3,
                paper_link: data.paper_link || null,
            });

            if (mentorErr) throw mentorErr;
        } else {
            const { error: menteeErr } = await supabase.from('mentee_profiles').insert({
                user_id: userId,
                title: data.title || '',
                company: data.company || '',
                bio: data.bio || '',
                interests: data.interests || [],
                mentorship_goals: data.mentorshipGoals || [],
                pronouns: data.pronouns || '',
                is_neurodivergent: !!data.neurodivergence,
                neurodivergence_details: data.neurodivergence || '',
            });

            if (menteeErr) throw menteeErr;
        }

        // 4) Cargar usuario enriquecido al contexto
        const fullUser = await enrichUserFromSchema(userId);
        setUser(fullUser);
    };

    const value = useMemo(() => {
        let role: UserRole | null = null;
        if (user) {
            role = user.role;
        }

        return {
            user,
            role,
            isLoggedIn: !!user,
            loading,
            login,
            logout,
            register,
            refreshUser,
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