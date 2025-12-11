import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useMemo,
    useEffect,
    useRef,
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

// ---------------- HELPERS SUPABASE ---------------- //

async function fetchUserBase(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select(
            'id, email, role, avatar_url, timezone, first_name, last_name, created_at, updated_at',
        )
        .eq('id', userId)
        .maybeSingle();

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
        .eq('is_booked', false);

    if (error) throw error;

    const availability: { [key: string]: string[] } = {};

    (data || []).forEach((block: any) => {
        const dateKey: string = block.specific_date || block.day_of_week?.toLowerCase();
        if (!dateKey) return;

        const time = block.start_time.slice(0, 5);

        if (!availability[dateKey]) {
            availability[dateKey] = [];
        }
        if (!availability[dateKey].includes(time)) {
            availability[dateKey].push(time);
        }
    });

    Object.keys(availability).forEach(key => {
        availability[key].sort();
    });

    return availability;
}

// ---------------- BUILDERS TIPADOS ---------------- //

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
        isNeurodivergent: profile?.is_neurodivergent ?? false,
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchingProfileRef = useRef<Set<string>>(new Set());
    const currentUserIdRef = useRef<string | null>(null);

    // Usuario mínimo desde sesión: NO forzar rol = 'mentee'
    const createFallbackUser = (sessionUser: any): User => {
        const metadata = sessionUser.user_metadata || {};
        const roleFromMetadata = metadata.role as UserRole | undefined;

        const baseUser: any = {
            id: sessionUser.id,
            name: metadata.name || sessionUser.email?.split('@')[0] || 'User',
            email: sessionUser.email || '',
            avatarUrl: metadata.avatarUrl || 'https://via.placeholder.com/150',
            interests: metadata.interests || [],
            availability: metadata.availability || {},
        };

        if (roleFromMetadata) {
            baseUser.role = roleFromMetadata;
        }

        return baseUser as User;
    };

    const fetchUserProfile = async (sessionUser: any): Promise<User | null> => {
        const userId = sessionUser.id;

        if (fetchingProfileRef.current.has(userId)) {
            console.log('⏭️ [AuthContext] Ya hay una consulta en curso para este usuario, omitiendo...');
            return null;
        }

        fetchingProfileRef.current.add(userId);
        const startTime = performance.now();
        console.log('🔍 [AuthContext] Iniciando fetchUserProfile para usuario:', userId);

        try {
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
                `✨ [AuthContext] Usuario completo construido (${totalTime.toFixed(
                    2,
                )}ms total)`,
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
            currentUserIdRef.current = session.user.id;
        } else {
            console.log('[AuthContext] no session.user, setting user null');
            setUser(null);
            currentUserIdRef.current = null;
        }

        console.log('[AuthContext] refreshUser end');
    };

    useEffect(() => {
        const initSession = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    setUser(null);
                    currentUserIdRef.current = null;
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    console.log('⚡ [AuthContext] Estableciendo usuario básico desde sesión (instantáneo)');
                    const fallbackUser = createFallbackUser(session.user);
                    setUser(fallbackUser);
                    currentUserIdRef.current = session.user.id;
                    setLoading(false);

                    console.log('🔄 [AuthContext] Iniciando carga de perfil completo en segundo plano...');
                    fetchUserProfile(session.user)
                        .then(fullUser => {
                            if (fullUser) {
                                console.log('📝 [AuthContext] Actualizando usuario con perfil completo (initSession)');
                                setUser(fullUser);
                            }
                        })
                        .catch(err => {
                            console.error(
                                '❌ [AuthContext] Error fetching user profile (non-blocking / initSession):',
                                err,
                            );
                        });
                } else {
                    setUser(null);
                    currentUserIdRef.current = null;
                    setLoading(false);
                }
            } catch (err) {
                console.error('Unexpected error in initSession:', err);
                setUser(null);
                currentUserIdRef.current = null;
                setLoading(false);
            }
        };

        initSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                if (session?.user) {
                    const incomingId = session.user.id;

                    if (currentUserIdRef.current === incomingId) {
                        console.log(
                            '🔄 [AuthContext] Auth state change - mismo usuario, NO recargamos perfil ni tocamos user',
                        );
                        return;
                    }

                    console.log('🔄 [AuthContext] Auth state change - nuevo usuario, recargando perfil');
                    currentUserIdRef.current = incomingId;

                    const fallbackUser = createFallbackUser(session.user);
                    setUser(fallbackUser);
                    setLoading(false);

                    fetchUserProfile(session.user)
                        .then(fullUser => {
                            if (fullUser) {
                                console.log(
                                    '📝 [AuthContext] Auth state change - actualizando con perfil completo',
                                );
                                setUser(fullUser);
                            }
                        })
                        .catch(err => {
                            console.error(
                                '❌ [AuthContext] Error fetching user profile in auth state change (non-blocking):',
                                err,
                            );
                        });
                } else {
                    setUser(null);
                    currentUserIdRef.current = null;
                    setLoading(false);
                }
            } catch (err) {
                console.error('Unexpected error in auth state change:', err);
                setUser(null);
                currentUserIdRef.current = null;
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
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            localStorage.removeItem('sb-access-token');
            localStorage.removeItem('sb-refresh-token');
            setUser(null);
            currentUserIdRef.current = null;
        } catch (error) {
            console.error('Logout failed', error);
            setUser(null);
            currentUserIdRef.current = null;
            localStorage.clear();
        }
    };

    const register = async (data: any, role: 'mentee' | 'mentor') => {
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

        const fullUser = await enrichUserFromSchema(userId);
        setUser(fullUser);
        currentUserIdRef.current = userId;
        setLoading(false);
    };

    const value = useMemo(() => {
        let resolvedRole: UserRole | null = null;
        if (user && (user as any).role) {
            resolvedRole = user.role;
        }

        return {
            user,
            role: resolvedRole,
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
            {children}

            {loading && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-[9999]">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        <p className="mt-4 text-muted-foreground">Cargando sesión...</p>
                    </div>
                </div>
            )}
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