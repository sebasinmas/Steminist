import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import type { UserRole, Mentee, Mentor } from '../types';
import { mockCurrentUserMentee, mockCurrentMentor } from '../data/mockData';

// A mock admin user for demonstration
const mockAdminUser = {
    id: 999,
    name: 'Admin User',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/74.jpg',
    expertise: ['Platform Management'],
    company: 'MentorHer Platform',
    title: 'Administrator'
};

export type User = Mentee | Mentor | typeof mockAdminUser;

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
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    const login = async (email: string, password?: string) => {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const emailLower = email.toLowerCase();
        
        if (emailLower === 'mentora@demo.com') {
            setUser(mockCurrentMentor);
        } else if (emailLower === 'mentoreada@demo.com') {
            setUser(mockCurrentUserMentee);
        } else if (emailLower === 'admin@demo.com') {
            setUser(mockAdminUser);
        } else if (emailLower === 'admin@admin.cl' && password === 'admin') {
            setUser(mockAdminUser);
        } else {
            throw new Error('Invalid credentials');
        }
    };

    const logout = () => {
        setUser(null);
    };

    const register = async (data: any, role: 'mentee' | 'mentor') => {
        console.log(`Registering new ${role}:`, data);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (role === 'mentor') {
            const newMentor: Mentor = {
                id: Date.now(),
                name: data.name,
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
        } else {
             const newMentee: Mentee = {
                id: Date.now(),
                name: data.name,
                avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/2.jpg',
                bio: 'Bienvenida a MentorHer. Completa tu perfil y empieza a buscar mentoras.',
                expertise: [],
                mentorshipGoals: [],
                availability: {},
                roleLevel: 'entry',
                neurodivergence: data.neurodivergence || undefined,
            };
            setUser(newMentee);
        }
    };

    const value = useMemo(() => {
        let role: UserRole | null = null;
        if (user) {
            if ('reviews' in user) role = 'mentor';
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
            {children}
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