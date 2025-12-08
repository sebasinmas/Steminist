import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useMemo,
    useEffect,
} from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole, User, Mentor, Mentee, AdminUser } from '../types';

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isLoggedIn: boolean;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    register: (data: any, role: 'mentee' | 'mentor') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------- HELPERS DE ACCESO A SUPABASE (SCHEMA MODELS) ---------------- //

async function fetchUserBase(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select(
            'id, email, role, avatar_url, timezone, first_name, last_name, created_at, updated_at'
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
            'title, company, bio, interests, mentorship_goals, expertise, max_mentees, average_rating, total_reviews, paper_link'
        )
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchMenteeProfile(userId: string) {
    const { data, error } = await supabase
        .from('mentee_profiles')
        .select(
            'title, company, bio, interests, mentorship_goals, role_level, pronouns, is_neurodivergent, neurodivergence_details'
        )
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
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
        links: profile?.paper_link
            ? [{ title: 'Publicación', url: profile.paper_link }]
            : [],
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
        experience: profile?.role_level ?? undefined,
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
        // Si aún no existe en models.users, no podemos construir un User
        return null;
    }

    const role = (baseUserRow.role || 'mentee') as UserRole;

    if (role === 'mentor') {
        const mentorProfile = await fetchMentorProfile(userId);
        return buildMentorUser(baseUserRow, mentorProfile);
    }

    if (role === 'mentee') {
        const menteeProfile = await fetchMenteeProfile(userId);
        return buildMenteeUser(baseUserRow, menteeProfile);
    }

    // Para admin u otros roles, devolvemos el subtipo AdminUser
    return buildAdminUserFromRow(baseUserRow);
}

// ---------------------- PROVIDER ---------------------- //

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario al inicio
    useEffect(() => {
        let active = true;

        const init = async () => {
            setLoading(true);
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
                const fullUser = await enrichUserFromSchema(session.user.id);
                if (active) setUser(fullUser);
            } else {
                if (active) setUser(null);
            }

            setLoading(false);
        };

        init();

        // Suscribirse a cambios de sesión
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const fullUser = await enrichUserFromSchema(session.user.id);
                setUser(fullUser);
            } else {
                setUser(null);
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password?: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password!,
        });

        if (error) throw error;
        const fullUser = await enrichUserFromSchema(data.user.id);
        setUser(fullUser);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    // Dentro de AuthContext.tsx
    const register = async (data: any, role: 'mentee' | 'mentor') => {
        // 1) Crear en Auth
        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });
        if (error) throw error;

        const userId =
            authData?.user?.id ||
            (await supabase.auth.getUser()).data.user?.id;

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
            const { error: mentorErr } = await supabase
                .from('mentor_profiles')
                .insert({
                    user_id: userId,
                    title: data.title || '',           // Cargo / Título Profesional
                    company: data.company || '',       // Empresa / Institución / Área
                    bio: data.bio || '',               // En el registro no tienes longBio, así que usa data.bio si lo quieres usar o déjalo vacío
                    interests: data.interests || [],   // Áreas de Interés
                    mentorship_goals: data.mentorshipGoals || [], // Objetivos de Mentoría
                    expertise: data.experience || null,          // Puedes mapear experiencia aquí si quieres
                    max_mentees: data.maxMentees || 3,
                    paper_link: data.paper_link || null,
                });

            if (mentorErr) throw mentorErr;
        } else {
            const { error: menteeErr } = await supabase
                .from('mentee_profiles')
                .insert({
                    user_id: userId,
                    title: data.title || '',
                    company: data.company || '',
                    bio: data.bio || '',
                    interests: data.interests || [],
                    mentorship_goals: data.mentorshipGoals || [],
                    role_level: data.experience || null,
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