import React from 'react';
import MetricCard from './MetricCard';
import { DocumentTextIcon, GlobeAltIcon, LightBulbIcon, AcademicCapIcon, HeartIcon, UsersIcon } from '../common/Icons';

const metrics = [
    { icon: <DocumentTextIcon />, value: 47, label: 'Artículos científicos publicados' },
    { icon: <UsersIcon />, value: 85, label: 'Mentoras que han acompañado proyectos' },
    { icon: <LightBulbIcon />, value: 120, label: 'Proyectos adjudicados o financiados' },
    { icon: <AcademicCapIcon />, value: 250, label: 'Alumnas con mentorías exitosas' },
    { icon: <GlobeAltIcon />, value: 30, label: 'Colaboraciones internacionales STEM' },
    { icon: <HeartIcon />, value: 15, label: 'Comunidades y colegios impactados' },
];

const ImpactMetrics: React.FC = () => {
    return (
        <section className="py-24 bg-secondary/50 dark:bg-secondary/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-extrabold mb-4">Nuestro Impacto</h2>
                <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
                    Medimos nuestro éxito por los logros de las increíbles mujeres de nuestra comunidad. Estos son nuestros resultados.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    {metrics.map((metric, index) => (
                        <MetricCard key={index} icon={metric.icon} value={metric.value} label={metric.label} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ImpactMetrics;
