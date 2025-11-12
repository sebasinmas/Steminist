import React, { useMemo } from 'react';
import type { Mentorship, Mentor } from '../../types';
import PieChart from '../common/PieChart';

interface AnalyticsChartsProps {
    mentorships: Mentorship[];
    mentors: Mentor[];
    mentorMenteesCount: Record<number, number>;
    menteeGoalsDistribution: Record<string, number>;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ mentorships, mentors, mentorMenteesCount, menteeGoalsDistribution }) => {

    const chartColors = ['rgb(var(--cyan))', 'rgb(var(--lilac))'];

    const mentorshipStatusData = useMemo(() => {
        const statusCounts = mentorships.reduce((acc, m) => {
            const status = m.status === 'termination_requested' ? 'Terminación Solicitada' :
                           m.status === 'active' ? 'Activas' : 'Completadas';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { name: 'Activas', value: statusCounts['Activas'] || 0 },
            { name: 'Completadas', value: statusCounts['Completadas'] || 0 },
            { name: 'Terminación Solicitada', value: statusCounts['Terminación Solicitada'] || 0 }
        ]
        .filter(d => d.value > 0)
        .map(({ name, value }, i) => ({ label: name, value, color: chartColors[i % chartColors.length] }));
    }, [mentorships]);

    const mentorCapacityData = useMemo(() => {
        const capacityCounts = { atCapacity: 0, withMentees: 0, available: 0 };
        mentors.forEach(mentor => {
            const count = mentorMenteesCount[mentor.id] || 0;
            if (count === 0) {
                capacityCounts.available++;
            } else if (count >= mentor.maxMentees) {
                capacityCounts.atCapacity++;
            } else {
                capacityCounts.withMentees++;
            }
        });
        return [
             { name: 'En Capacidad Máxima', value: capacityCounts.atCapacity },
             { name: 'Con Mentoreadas', value: capacityCounts.withMentees },
             { name: 'Totalmente Disponibles', value: capacityCounts.available }
        ]
        .filter(d => d.value > 0)
        .map(({ name, value }, i) => ({ label: name, value, color: chartColors[i % chartColors.length] }));
    }, [mentors, mentorMenteesCount]);

    const menteeGoalsData = useMemo(() => {
        return Object.entries(menteeGoalsDistribution)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value], index) => ({
                label: name,
                value,
                color: chartColors[index % chartColors.length]
            }));
    }, [menteeGoalsDistribution]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Análisis de la Plataforma</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <PieChart title="Estado de Mentorías" data={mentorshipStatusData} />
                <PieChart title="Capacidad de Mentoras" data={mentorCapacityData} />
                <PieChart title="Objetivos de Mentoreadas" data={menteeGoalsData} />
            </div>
        </div>
    );
};

export default AnalyticsCharts;
