import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { authService } from '../services/authService';
import type { UserRole, Mentee, Mentor, User } from '../types';

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

    // Initialize auth state from localStorage/Token
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const user = await authService.validateToken(token);
                    setUser(user);
                } catch (error) {
                    console.error("Invalid token", error);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user'); // Clean up legacy
                }
            } else {
                // Fallback to legacy user storage if no token (optional, for backward compat during dev)
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch (e) {
                        localStorage.removeItem('user');
                    }
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    // Sync user to localStorage (legacy support, can be removed if we fully rely on token)
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    const login = async (email: string, password?: string) => {
        try {
            const { user, token } = await authService.login(email, password);
            setUser(user);
            localStorage.setItem('authToken', token);
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    };

    const register = async (data: any, role: 'mentee' | 'mentor') => {
        console.log(`Registering new ${role}:`, data);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500));

        if (role === 'mentor') {
            const newMentor: Mentor = {
                id: Date.now(),
                name: data.name,
                email: data.email || 'newmentor@example.com',
                role: 'mentor',
                avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/1.jpg',
                title: 'Nueva Mentora',
                company: 'Tu Compañía',
                rating: 5.0,
                reviews: 0,
                expertise: ['Edita tu perfil para añadir'],
                longBio: 'Bienvenida a MentorHer. Por favor, completa tu perfil para que las mentoreadas puedan encontrarte.',
                mentoringTopics: [],
                availability: {},
                maxMentees: 2,
                roleLevel: 'senior',
            };
            setUser(newMentor);
            localStorage.setItem('authToken', 'mock_token_from_register');
        } else {
            const newMentee: Mentee = {
                id: Date.now(),
                name: data.name,
                email: data.email || 'newmentee@example.com',
                role: 'mentee',
                avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/2.jpg',
                bio: 'Bienvenida a MentorHer. Completa tu perfil y empieza a buscar mentoras.',
                expertise: [],
                mentorshipGoals: [],
                availability: {},
                roleLevel: 'entry',
                neurodivergence: data.neurodivergence || undefined,
            };
            setUser(newMentee);
            localStorage.setItem('authToken', 'mock_token_from_register');
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