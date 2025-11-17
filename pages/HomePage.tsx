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

    // FIX: Add type guards using the `in` operator to narrow the `user` type.
    // This resolves the error where the generic `User` type from `useAuth` was
    // not assignable to the more specific `Mentor` or `Mentee` props.
    if (role === 'mentor' && 'reviews' in user) {
        return <LandingPageMentor user={user} />;
    }

    if (role === 'mentee' && 'mentorshipGoals' in user) {
        return <LandingPageMentee user={user} />;
    }

    // Fallback for any other case
    return <LandingPage />;
};

export default HomePage;
