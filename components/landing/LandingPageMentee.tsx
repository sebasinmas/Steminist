import React from 'react';
import { Link } from 'react-router-dom';
import type { Mentee } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import ImpactMetrics from './ImpactMetrics';

interface LandingPageMenteeProps {
    user: Mentee;
}

const LandingPageMentee: React.FC<LandingPageMenteeProps> = ({ user }) => {
    return (
        <>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                    ¡Qué bueno verte, {user.name.split(' ')[0]}!
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                    Estás un paso más cerca de alcanzar tus metas. ¿Qué te gustaría hacer hoy?
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <Link to="/dashboard">
                        <Button size="lg" as="span">
                            Ir a mi Panel de Control
                        </Button>
                    </Link>
                    <Link to="/discover">
                         <Button size="lg" variant="secondary" as="span">
                            Descubrir Nuevas Mentoras
                        </Button>
                    </Link>
                </div>
            </div>
            <ImpactMetrics />
        </>
    );
};

export default LandingPageMentee;
