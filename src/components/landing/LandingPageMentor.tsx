import React from 'react';
import { Link } from 'react-router-dom';
import type { Mentor } from '../../../types';
import Button from '../common/Button';
import ImpactMetrics from './ImpactMetrics';

interface LandingPageMentorProps {
    user: Mentor;
}

const LandingPageMentor: React.FC<LandingPageMentorProps> = ({ user }) => {
    return (
        <>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-linear-to-r from-lilac to-magenta">
                    Gracias por tu impacto, {user.name.split(' ')[0]}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                    Tu guía es fundamental para la próxima generación de líderes en STEM. ¿Lista para continuar?
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                     <Link to="/dashboard">
                        <Button size="lg" as="span">
                            Ir a mi Panel de Control
                        </Button>
                    </Link>
                    <Link to="/profile">
                         <Button size="lg" variant="secondary" as="span">
                            Actualizar mi Perfil
                        </Button>
                    </Link>
                </div>
            </div>
            <ImpactMetrics />
        </>
    );
};

export default LandingPageMentor;
