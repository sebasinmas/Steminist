import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';
import LandingPageMentee from '../components/landing/LandingPageMentee';
import LandingPageMentor from '../components/landing/LandingPageMentor';

const HomePage: React.FC = () => {
    const { isLoggedIn, user, role, loading } = useAuth();

    // 1) Mientras el AuthContext está cargando la sesión inicial
    //    o estamos loguead@s pero aún no tenemos rol resuelto,
    //    NO mostramos la landing genérica.
    if (loading || (isLoggedIn && !role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    <p className="mt-4 text-muted-foreground">
                        Preparando tu experiencia...
                    </p>
                </div>
            </div>
        );
    }

    // 2) No hay sesión: mostramos la landing pública
    if (!isLoggedIn || !user) {
        return <LandingPage />;
    }

    // 3) Con rol admin, redirigimos al panel admin
    if (role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    // 4) Con rol mentor, mostramos landing de mentora
    if (role === 'mentor') {
        return <LandingPageMentor user={user as any} />;
    }

    // 5) Con rol mentee, mostramos landing de mentoreada
    if (role === 'mentee') {
        return <LandingPageMentee user={user as any} />;
    }

    // 6) Fallback por si algo raro pasa con el rol
    return <LandingPage />;
};

export default HomePage;