import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';
import LandingPageMentee from '../components/landing/LandingPageMentee';
import LandingPageMentor from '../components/landing/LandingPageMentor';

const HomePage: React.FC = () => {
    const { isLoggedIn, user, role } = useAuth();

    if (!isLoggedIn || !user) {
        return <LandingPage />;
    }

    if (role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    // We cast user to the specific type because we trust the role from AuthContext
    // and the components only use common fields like 'name' for the welcome message.
    if (role === 'mentor') {
        return <LandingPageMentor user={user as any} />;
    }

    if (role === 'mentee') {
        return <LandingPageMentee user={user as any} />;
    }

    // Fallback for any other case
    return <LandingPage />;
};

export default HomePage;
