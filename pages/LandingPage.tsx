import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { MENTORSHIP_CATEGORIES } from '../constants';
import ImpactMetrics from '../components/landing/ImpactMetrics';

const LandingPage: React.FC = () => {
    return (
        <>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                    Te damos la bienvenida a MentorHer
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                    Conectando a mujeres en STEM con mentoras experimentadas para fomentar el crecimiento, la innovación y el liderazgo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
                    <Card className="text-left transform hover:scale-105 transition-transform duration-300 flex flex-col">
                        <h2 className="text-2xl font-bold mb-4">Soy Mentoreada</h2>
                        <p className="text-muted-foreground mb-6 flex-grow">
                            ¿Buscas orientación? Encuentra una experta en tu campo, reserva una sesión y acelera tu carrera.
                        </p>
                        <Link to="/register/mentee" className="w-full">
                            <Button as="span" className="w-full" size="lg">Encontrar una Mentora</Button>
                        </Link>
                    </Card>
                    <Card className="text-left transform hover:scale-105 transition-transform duration-300 flex flex-col">
                        <h2 className="text-2xl font-bold mb-4">Soy Mentora</h2>
                        <p className="text-muted-foreground mb-6 flex-grow">
                            ¿Lista para compartir tu conocimiento? Únete a nuestra comunidad de expertas y genera un impacto duradero.
                        </p>
                        <Link to="/register/mentor" className="w-full">
                            <Button as="span" className="w-full" variant="secondary" size="lg">Convertirme en Mentora</Button>
                        </Link>
                    </Card>
                </div>
                
                <p className="text-center text-muted-foreground">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                        Inicia Sesión aquí
                    </Link>
                </p>
                
                <div className="max-w-5xl mx-auto mt-16">
                    <h3 className="text-2xl font-bold mb-6">Explora Mentorías en...</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {MENTORSHIP_CATEGORIES.slice(0, 7).map(category => (
                            <span key={category} className="bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-2 rounded-full">
                                {category}
                            </span>
                        ))}
                        <span className="bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-2 rounded-full">
                            ...¡y más!
                        </span>
                    </div>
                </div>
            </div>

            <ImpactMetrics />

        </>
    );
};


export default LandingPage;