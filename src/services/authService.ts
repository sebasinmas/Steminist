import { User } from '../types';
import { mockCurrentUserMentee, mockCurrentMentor } from '../data/mockData';

// Mock Admin User (duplicated here to avoid circular deps if it was in context, 
// but ideally should be in data/mockData.ts. For now keeping it consistent with previous context)
const mockAdminUser = {
    id: 999,
    name: 'Admin User',
    email: 'admin@admin.cl',
    role: 'admin' as const,
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/74.jpg',
    expertise: ['Platform Management'],
    company: 'MentorHer Platform',
    title: 'Administrator'
};

interface LoginResponse {
    user: User;
    token: string;
}

export const authService = {
    login: async (email: string, password?: string): Promise<LoginResponse> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const emailLower = email.toLowerCase();
        let user: User | null = null;

        // Mock logic matching the previous AuthContext logic
        if (emailLower === 'mentora@demo.com') {
            user = mockCurrentMentor;
        } else if (emailLower === 'mentoreada@demo.com') {
            user = mockCurrentUserMentee;
        } else if (emailLower === 'admin@demo.com') {
            user = mockAdminUser;
        } else if (emailLower === 'admin@admin.cl' && password === 'admin') {
            user = mockAdminUser;
        }

        if (user) {
            // Generate a fake JWT
            // Structure: header.payload.signature
            const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
            const payload = btoa(JSON.stringify({
                sub: user.id,
                name: user.name,
                role: 'role' in user ? user.role : ('reviews' in user ? 'mentor' : 'mentee'),
                iat: Date.now()
            }));
            const signature = "mock_signature_secret";
            const token = `${header}.${payload}.${signature}`;

            return { user, token };
        } else {
            throw new Error('Invalid credentials');
        }
    },

    validateToken: async (token: string): Promise<User> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // In a real app, we would verify the signature and expiration.
        // For this mock, we just check if it looks like our mock token.
        if (!token || !token.includes('.')) {
            throw new Error('Invalid token');
        }

        // Decode payload to find user (very naive implementation)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            // Return the correct mock user based on ID or Name from payload
            // Since our mock data is static, we can just return the matching object
            if (payload.name === mockCurrentMentor.name) return mockCurrentMentor;
            if (payload.name === mockCurrentUserMentee.name) return mockCurrentUserMentee;
            if (payload.name === mockAdminUser.name) return mockAdminUser;

            throw new Error('User not found');
        } catch (e) {
            throw new Error('Invalid token structure');
        }
    }
};
