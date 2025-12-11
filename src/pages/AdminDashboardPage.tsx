import React, { useMemo, useState } from 'react';
import type { Session, ConnectionRequest, Mentor, Mentee, Mentorship, SupportTicket } from '../types';
import Card from '../components/common/Card';
import MetricsCard from '../components/admin/MetricsCard';
import AdminRequestCard from '../components/admin/AdminRequestCard';
import Button from '../components/common/Button';
import { UsersIcon, BriefcaseIcon, StarIcon, TrendingUpIcon, InformationCircleIcon } from '../components/common/Icons';
import Tabs from '../components/common/Tabs';
import MentorManagement from '../components/admin/MentorManagement';
import MenteeManagement from '../components/admin/MenteeManagement';
import MentorDetailsModal from '../components/admin/MentorDetailsModal';
import MenteeDetailsModal from '../components/admin/MenteeDetailsModal';
import AnalyticsDetailModal from '../components/admin/AnalyticsDetailModal';
import AnalyticsCharts from '../components/admin/AnalyticsCharts';
import Tooltip from '../components/common/Tooltip';
import SupportTicketCard from '../components/admin/SupportTicketCard';


interface AdminDashboardPageProps {
    mentorships: Mentorship[];
    requests: ConnectionRequest[];
    mentors: Mentor[];
    mentees: Mentee[];
    updateConnectionStatus: (requestId: number, newStatus: 'accepted' | 'rejected' | 'pending_mentor') => void;
    updateMentorMaxMentees: (mentorId: number, maxMentees: number) => void;
    supportTickets: SupportTicket[];
    updateSupportTicketStatus: (ticketId: number, status: 'resolved') => void;
}

const tabTooltips: Record<string, string> = {
    "Métricas": "Esta sección ofrece una vista general del rendimiento de la plataforma. Analiza el estado de las mentorías, la capacidad de las mentoras y los objetivos más populares entre las mentoreadas para tomar decisiones informadas.",
    "Solicitudes": "Aquí puedes gestionar las solicitudes de conexión de nuevas mentoreadas y las solicitudes de terminación de mentorías existentes. Aprueba o rechaza para mantener el flujo de la plataforma.",
    "Gestión de Mentoras": "Controla la capacidad de cada mentora para asegurar que no se sobrecarguen y puedan ofrecer una experiencia de calidad. Puedes ver sus perfiles y estadísticas de mentoría.",
    "Gestión de Mentoreadas": "Visualiza la lista de todas las mentoreadas en la plataforma, junto con sus estadísticas de mentorías activas y completadas. Accede a sus perfiles para más detalles.",
    "Mentorías Activas": "Revisa todas las mentorías que están actualmente en curso. Esto te permite supervisar la actividad y el progreso general de las conexiones en la plataforma."
};

const SectionTitle: React.FC<{ title: string; tooltipText: string; count?: number }> = ({ title, tooltipText, count }) => (
    <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold">{title}{typeof count !== 'undefined' && ` (${count})`}</h2>
        <Tooltip content={tooltipText}>
            <InformationCircleIcon className="w-6 h-6 text-muted-foreground cursor-pointer" />
        </Tooltip>
    </div>
);


const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ mentorships, requests, mentors, mentees, updateConnectionStatus, updateMentorMaxMentees, supportTickets, updateSupportTicketStatus }) => {

    const [selectedMentorForDetails, setSelectedMentorForDetails] = useState<Mentor | null>(null);
    const [selectedMenteeForDetails, setSelectedMenteeForDetails] = useState<Mentee | null>(null);
    const [selectedMentorshipForDetails, setSelectedMentorshipForDetails] = useState<Mentorship | null>(null);

    const handleViewMentorDetails = (mentor: Mentor) => setSelectedMentorForDetails(mentor);
    const handleViewMenteeDetails = (mentee: Mentee) => setSelectedMenteeForDetails(mentee);

    const allSessions = useMemo(() => mentorships.flatMap(m => m.sessions), [mentorships]);

    const metrics = useMemo(() => {
        const completedSessions = allSessions.filter(s => s.status === 'completed' && s.rating);
        const totalRatings = completedSessions.reduce((acc, s) => acc + (s.rating || 0), 0);
        const avgRating = completedSessions.length > 0 ? (totalRatings / completedSessions.length).toFixed(2) : 'N/A';
        const uniqueMentees = new Set(mentorships.map(m => m.mentee.id)).size;

        return {
            totalMentees: uniqueMentees,
            activeMentorships: mentorships.filter(m => m.status === 'active').length,
            completedMentorships: mentorships.filter(m => m.status === 'completed').length,
            avgRating: avgRating,
        };
    }, [mentorships, allSessions]);

    const allMenteesWithStats = useMemo(() => {
        const menteeMap = new Map<number | string, { mentee: Mentee, active: number, completed: number }>();

        // Initialize with all fetched mentees
        mentees.forEach(mentee => {
            menteeMap.set(mentee.id, {
                mentee: mentee,
                active: 0,
                completed: 0
            });
        });

        // Add stats from mentorships
        mentorships.forEach(m => {
            if (!menteeMap.has(m.mentee.id)) {
                // Fallback if mentee not in list (shouldn't happen if fetched correctly)
                menteeMap.set(m.mentee.id, {
                    mentee: m.mentee,
                    active: 0,
                    completed: 0
                });
            }
            const stats = menteeMap.get(m.mentee.id)!;
            if (m.status === 'active') stats.active++;
            else if (m.status === 'completed') stats.completed++;
        });
        return Array.from(menteeMap.values());
    }, [mentorships, mentees]);

    const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
    const terminationRequests = useMemo(() => mentorships.filter(s => s.status === 'termination_requested'), [mentorships]);
    const openSupportTickets = useMemo(() => supportTickets.filter(t => t.status === 'open'), [supportTickets]);

    const mentorMenteesCount = useMemo(() => {
        const counts: Record<string | number, number> = {};
        mentorships.filter(m => m.status === 'active').forEach(m => {
            counts[m.mentor.id] = (counts[m.mentor.id] || 0) + 1;
        });
        return counts;
    }, [mentorships]);

    const menteeGoalsDistribution = useMemo(() => {
        const goalCounts: Record<string, number> = {};
        mentorships.forEach(m => {
            (m.mentee.mentorshipGoals || []).forEach(goal => {
                goalCounts[goal] = (goalCounts[goal] || 0) + 1;
            });
        });
        return goalCounts;
    }, [mentorships]);

    const tabs = ["Métricas", "Solicitudes", "Gestión de Mentoras", "Gestión de Mentoreadas", "Mentorías Activas"];
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-8">Panel de Administrador</h1>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="mt-8">
                {activeTab === "Métricas" && (
                    <div className="space-y-8">
                        <SectionTitle title="Métricas" tooltipText={tabTooltips["Métricas"]} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricsCard title="Total de Mentoreadas" value={metrics.totalMentees.toString()} icon={<UsersIcon className="w-8 h-8" />} />
                            <MetricsCard title="Mentorías Activas" value={metrics.activeMentorships.toString()} icon={<BriefcaseIcon className="w-8 h-8" />} />
                            <MetricsCard title="Mentorías Completadas" value={metrics.completedMentorships.toString()} icon={<TrendingUpIcon className="w-8 h-8" />} />
                            <MetricsCard title="Calificación Promedio" value={metrics.avgRating} icon={<StarIcon className="w-8 h-8" />} />
                        </div>
                        <AnalyticsCharts
                            mentorships={mentorships}
                            mentors={mentors}
                            mentorMenteesCount={mentorMenteesCount}
                            menteeGoalsDistribution={menteeGoalsDistribution}
                        />
                    </div>
                )}

                {activeTab === "Solicitudes" && (
                    <div>
                        <SectionTitle title="Solicitudes" tooltipText={tabTooltips["Solicitudes"]} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-foreground/80">Solicitudes de Mentoría Pendientes ({pendingRequests.length})</h3>
                                {pendingRequests.length > 0 ? (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                        {pendingRequests.map(req => (
                                            <AdminRequestCard key={req.id} request={req} onStatusChange={updateConnectionStatus} mentorCurrentMentees={mentorMenteesCount[req.mentor.id] || 0} />
                                        ))}
                                    </div>
                                ) : (
                                    <Card><p className="text-muted-foreground">No hay solicitudes pendientes.</p></Card>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-foreground/80">Solicitudes de Terminación ({terminationRequests.length})</h3>
                                {terminationRequests.length > 0 ? (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                        {terminationRequests.map(m => (
                                            <Card key={m.id}>
                                                <p className="font-semibold">Mentora: {m.mentor.name}</p>
                                                <p className="text-sm">Mentoreada: {m.mentee.name}</p>
                                                {m.terminationReason && (
                                                    <div className="mt-2 pt-2 border-t border-border">
                                                        <h4 className="font-semibold text-sm mb-1">Razón para la Terminación:</h4>
                                                        <p className="text-sm text-foreground/80 bg-secondary p-2 rounded-md italic">"{m.terminationReason}"</p>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-4">
                                                    {/* Logic to update mentorship status would go here */}
                                                    <Button size="sm">Confirmar</Button>
                                                    <Button size="sm" variant="secondary">Denegar</Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card><p className="text-muted-foreground">No hay solicitudes de terminación.</p></Card>
                                )}
                            </div>
                        </div>
                        <div className="mt-12">
                            <h3 className="text-xl font-semibold mb-4 text-foreground/80">Consultas de Soporte ({openSupportTickets.length})</h3>
                            {openSupportTickets.length > 0 ? (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {openSupportTickets.map(ticket => (
                                        <SupportTicketCard
                                            key={ticket.id}
                                            ticket={ticket}
                                            onUpdateStatus={updateSupportTicketStatus}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Card><p className="text-muted-foreground">No hay consultas de soporte pendientes.</p></Card>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "Gestión de Mentoras" && (
                    <div>
                        <SectionTitle title="Gestión de Mentoras" tooltipText={tabTooltips["Gestión de Mentoras"]} />
                        <MentorManagement
                            mentors={mentors}
                            mentorMenteesCount={mentorMenteesCount}
                            onUpdateMaxMentees={updateMentorMaxMentees}
                            onViewDetails={handleViewMentorDetails}
                        />
                    </div>
                )}

                {activeTab === "Gestión de Mentoreadas" && (
                    <div>
                        <SectionTitle title="Gestión de Mentoreadas" tooltipText={tabTooltips["Gestión de Mentoreadas"]} />
                        <MenteeManagement
                            menteesWithStats={allMenteesWithStats}
                            onViewDetails={handleViewMenteeDetails}
                        />
                    </div>
                )}

                {activeTab === "Mentorías Activas" && (
                    <div>
                        <SectionTitle title="Mentorías Activas" tooltipText={tabTooltips["Mentorías Activas"]} count={metrics.activeMentorships} />
                        <div className="space-y-4">
                            {mentorships.filter(m => m.status === 'active').map(m => (
                                <Card key={m.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p><strong>Mentora:</strong> {m.mentor.name}</p>
                                        <p><strong>Mentoreada:</strong> {m.mentee.name}</p>
                                        <p className="text-sm text-muted-foreground">Progreso: {m.sessions.filter(s => s.status === 'completed').length} de 3 sesiones completadas</p>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => setSelectedMentorshipForDetails(m)}>Ver Detalles</Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <MentorDetailsModal
                mentor={selectedMentorForDetails}
                mentorships={mentorships}
                onClose={() => setSelectedMentorForDetails(null)}
            />

            <MenteeDetailsModal
                mentee={selectedMenteeForDetails}
                mentorships={mentorships}
                onClose={() => setSelectedMenteeForDetails(null)}
            />

            <AnalyticsDetailModal
                isOpen={!!selectedMentorshipForDetails}
                onClose={() => setSelectedMentorshipForDetails(null)}
                mentorship={selectedMentorshipForDetails}
            />
        </div>
    );
};

export default AdminDashboardPage;
