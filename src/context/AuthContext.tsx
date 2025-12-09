import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole, User, Mentor, Mentee, AdminUser, BaseUser } from '../types';
import { Database } from '@/types/Database';
import { RegisterDTO } from '@/DTO/Register.dto';

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    register: (data: any, role: 'mentee' | 'mentor') => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // --- 1. Formateador Unificado (Evita errores de tipos) ---
    const formatUser = useCallback((base: Database["models"]["Tables"]["users"]["Row"], profile: Database["models"]["Tables"]["mentor_profiles"]["Row"] | Database["models"]["Tables"]["mentee_profiles"]["Row"]): User => {
        console.info("[AuthContext] Formateando usuario (Esto es parsear de db a un objeto para el context):", base, profile);
        if (base.role === 'mentor' && profile) {
            const mentorProfile = profile as Database["models"]["Tables"]["mentor_profiles"]["Row"];
            let mentorUser: Mentor = {
                id: base.id,
                name: `${base.first_name || ''} ${base.last_name || ''}`.trim(),
                first_name: base.first_name || undefined,
                last_name: base.last_name || undefined,
                email: base.email,
                avatarUrl: base.avatar_url || '',
                interests: profile.interests || [],
                title: mentorProfile.title,
                company: mentorProfile.company,
                expertise: mentorProfile.expertise,
                role: 'mentor',
                rating: mentorProfile.average_rating || 0,
                reviews: mentorProfile.total_reviews || 0,
                mentorshipGoals: mentorProfile.mentorship_goals,
                maxMentees: mentorProfile.max_mentees,
                links: mentorProfile.paper_link ? JSON.parse(mentorProfile.paper_link) : [],
            }
            return mentorUser;
        } else if (base.role === 'mentee' && profile) {
            const menteeProfile = profile as Database["models"]["Tables"]["mentee_profiles"]["Row"];
            let menteeUser: Mentee = {
                bio: menteeProfile.bio || '',
                company: menteeProfile.company || '',
                title: menteeProfile.title || '',
                first_name: base.first_name || undefined,
                last_name: base.last_name || undefined,
                pronouns: menteeProfile.pronouns || undefined,
                neurodivergence: menteeProfile.neurodivergence_details || undefined,
                role: 'mentee',
                mentorshipGoals: menteeProfile.mentorship_goals || [],
                id: base.id,
                name: `${base.first_name || ''} ${base.last_name || ''}`.trim(),
                email: base.email,
                avatarUrl: base.avatar_url || '',
                interests: profile.interests || []
            }

            return menteeUser;
        }else if (base.role === 'admin') {
            const adminUser: AdminUser = {
                id: base.id,
                name: base.first_name ? `${base.first_name} ${base.last_name || ''}`.trim() : 'Admin User',
                email: base.email,
                role: 'admin',
                avatarUrl: base.avatar_url || '',
                interests: [],
                company: '',
                title: ''
            };
            return adminUser;
        }
        console.error('[AuthContext] Rol de usuario no reconocido o perfil faltante:', base.role, profile);
        throw new Error('User role not recognized or profile missing');

    }, []);

    // --- 2. Fetch Centralizado (Con Auto-Corrección) ---
    const fetchUserData = useCallback(async (userId: string) => {
        try {
            // Primero voy a revisar si la sesión es válida
            // Básicamente es ver si en el auth de supabase hay sesión y coincide con el userId solicitado
            // 1. Obtener usuario base
            const { data:  {session}  } = await supabase.auth.getSession();
            if (!session || session.user.id !== userId) {
                console.warn('[AuthContext] Sesión inválida o usuario no coincide. Limpiando estado de usuario.');
                setUser(null);
                return;
            }

            // a) Buscar en tabla pública users
            const { data: baseUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            if (error) {
                console.error('[AuthContext] Error fetching base user:', error);
                throw error;
            }
            // b) AUTOCORRECCIÓN: Si hay sesión pero no hay usuario en BD
            if (!baseUser) {
                console.warn('[AuthContext] Usuario huérfano detectado (Auth sí, DB no). Cerrando sesión...');
                await supabase.auth.signOut();
                setUser(null);
                return;
            }

            // c) Buscar perfil específico
            let profile = null;
            const table = baseUser.role === 'mentor' ? 'mentor_profiles' :
                baseUser.role === 'mentee' ? 'mentee_profiles' : null;
            if (table) {
                const { data } = await supabase.from(table).select('*').eq('user_id', userId).maybeSingle();
                profile = data;
            }
            // d) Guardar usuario completo
            setUser(formatUser(baseUser, profile));
            console.log('[AuthContext] Usuario cargado:', baseUser.email);

        } catch (err) {
            console.error('[AuthContext] Fallo crítico cargando usuario:', err);
            // En caso de error grave, dejamos al usuario como null para no bloquear la UI
            setUser(null);
        }
    }, [formatUser]);

    // --- 3. Inicialización Robusta (Arreglo del Spinner) ---
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Obtener sesión inicial
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session?.user && mounted) {
                    await fetchUserData(session.user.id);
                }
            } catch (error) {
                console.error('[AuthContext] Error en inicialización:', error);
                if (mounted) setUser(null);
            } finally {
                // ESTO ES CLAVE: El finally asegura que el spinner se quite SIEMPRE
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        init();

        // Escuchar cambios de sesión
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Evento: ${event}`);

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                // Solo recargamos si el usuario cambió para evitar parpadeos
                if (!user || user.id !== session.user.id) {
                    await fetchUserData(session.user.id);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserData]); // user removido de dep para evitar bucles

    // --- 4. Acciones (Login, Logout, Register) ---

    const login = async (email: string, password?: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: password! });
            if (error) throw error;
            if (data.user) await fetchUserData(data.user.id);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (dataFromRegisterForm: RegisterDTO) => {
        setLoading(true);
        console.info("Registrando el usuario con la siguiente data: ", dataFromRegisterForm);
        if (!dataFromRegisterForm.role) throw new Error('El rol es obligatorio para el registro');
        try {
            //Primero voy a revisar si el usuario ya existe y voy a renombrar en el destructuring
            console.info("Creando el usuario en Supabase Auth...");
            const { data: AuthUser, error: signUpError } = await supabase.auth.signUp({
                email: dataFromRegisterForm.email,
                password: dataFromRegisterForm.password,
            });
            //Si el usuario ya existe, lanzo el error
            if (signUpError) throw signUpError;
            if (!AuthUser.user) throw new Error('User not created');
            //Una vez creado en el auth vamos a insertar el resto de datos en: La tabla general models.Users y luego
            //la tabla específica dependiendo del rol
            console.info("Insertando datos adicionales en la base de datos de USERS...");
            const { data: insertedUser, error: insertUserError } = await supabase.from('users').insert([{
                id: AuthUser.user.id,
                email: dataFromRegisterForm.email,
                first_name: dataFromRegisterForm.first_name,
                last_name: dataFromRegisterForm.last_name,
                role: dataFromRegisterForm.role,
                avatar_url: dataFromRegisterForm.avatar_url || null
            }]);
            if (insertUserError || !insertedUser) throw insertUserError;
            // Ahora insertamos en la tabla específica
            console.info(`Insertando perfil específico para el rol ${dataFromRegisterForm.role}...`);
            if (dataFromRegisterForm.role === 'mentee') {
                const { error: insertMenteeError } = await supabase.from('mentee_profiles').insert([{
                    user_id: AuthUser.user.id,
                    title: dataFromRegisterForm.title || null,
                    company: dataFromRegisterForm.company || null,
                    bio: dataFromRegisterForm.bio || null,
                    role_level: dataFromRegisterForm.role_level || null,
                    pronouns: dataFromRegisterForm.pronouns || null,
                    is_neurodivergent: dataFromRegisterForm.is_neurodivergent || null,
                    neurodivergence_details: dataFromRegisterForm.neurodivergence_details || null,
                }]);
                if (insertMenteeError) throw insertMenteeError;
            } else if (dataFromRegisterForm.role === 'mentor') {
                const { error: insertMentorError } = await supabase.from('mentor_profiles').insert([{
                    title: dataFromRegisterForm.title || null,
                    company: dataFromRegisterForm.company || null,
                    bio: dataFromRegisterForm.bio || null,
                    long_bio: dataFromRegisterForm.long_bio || null,
                    user_id: AuthUser.user.id,
                    max_mentees: 3 // Valor por defecto
                    
                }]);
                if (insertMentorError) throw insertMentorError;
            }
            // Finalmente, cargamos el usuario en el contexto
            console.log("Cargando el usuario recién registrado en el contexto...");
            await fetchUserData(AuthUser.user.id);
            console.info("Registro completado y usuario cargado en el contexto.");
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        } finally {
            // La carga se desactiva al final
            setLoading(false);
        }

    };

    const refreshUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await fetchUserData(session.user.id);
    };

    const value = useMemo(() => ({
        user,
        role: user?.role || null,
        isLoggedIn: !!user,
        isLoading: loading,
        login,
        logout,
        register,
        refreshUser
    }), [user, loading, login, logout, register, refreshUser]);

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex h-screen w-full items-center justify-center bg-background">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
};