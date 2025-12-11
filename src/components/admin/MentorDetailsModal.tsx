import React, { useMemo } from 'react';
import type { Mentor, Mentorship } from '../../types';
import { XIcon, BriefcaseIcon, CheckCircleIcon, ClockIcon, StarIcon } from '../common/Icons';
import { Avatar } from '../common/Avatar';

interface MentorDetailsModalProps {
    mentor: Mentor | null;
    mentorships: Mentorship[];
    onClose: () => void;
}

const DetailStat: React.FC<{ icon: React.ReactNode; value: string | number; label: string }> = ({ icon, value, label }) => (
    <div className="flex items-center space-x-3 bg-secondary/50 p-3 rounded-lg">
        <div className="text-primary">{icon}</div>
        <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    </div>
);


const MentorDetailsModal: React.FC<MentorDetailsModalProps> = ({ mentor, mentorships, onClose }) => {

    const mentorMentorships = useMemo(() => {
        if (!mentor) return [];
        return mentorships.filter(m => m.mentor.id === mentor.id);
    }, [mentor, mentorships]);

    const stats = useMemo(() => {
        if (!mentor) return null;
        const active = mentorMentorships.filter(m => m.status === 'active').length;
        const completed = mentorMentorships.filter(m => m.status === 'completed').length;
        const allSessions = mentorMentorships.flatMap(m => m.sessions);
        const completedSessions = allSessions.filter(s => s.status === 'completed' || s.status === 'active');
        const displayRating = mentor.rating.toFixed(2);

        return { active, completed, completedSessions: completedSessions.length, displayRating };
    }, [mentor, mentorMentorships]);


    if (!mentor || !stats) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-6 m-4 max-w-3xl w-full relative transform transition-all max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                    <Avatar src={mentor.avatarUrl} alt={mentor.name} className="w-24 h-24 mb-4" />
                    <h2 className="text-3xl font-bold">{mentor.name}</h2>
                    <p className="text-lg text-primary">{mentor.title}</p>
                    <p className="text-md text-muted-foreground">{mentor.company}</p>

                    <div className="flex justify-center mt-3">
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold border ${mentor.experience === 'Senior' || mentor.experience === 'Lead' || mentor.experience === 'senior' || mentor.experience === 'lead' ? 'bg-purple-500/10 text-purple-600 border-purple-200' :
                            mentor.experience === 'Mid' || mentor.experience === 'mid' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                                'bg-green-500/10 text-green-600 border-green-200'
                            }`}>
                            {mentor.experience}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
                    <DetailStat icon={<BriefcaseIcon />} value={stats.active} label="Mentorías Activas" />
                    <DetailStat icon={<CheckCircleIcon />} value={stats.completed} label="Mentorías Completadas" />
                    <DetailStat icon={<ClockIcon />} value={stats.completedSessions} label="Sesiones Completadas" />
                    <DetailStat icon={<StarIcon />} value={stats.displayRating} label="Rating Promedio" />
                </div>

                <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-4">Historial de Mentorías</h3>
                    <div className="space-y-3">
                        {mentorMentorships.length > 0 ? (
                            mentorMentorships.map(m => (
                                <div key={m.id} className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar src={m.mentee.avatarUrl} alt={m.mentee.name} className="w-10 h-10" />
                                        <div>
                                            <p className="font-semibold">{m.mentee.name}</p>
                                            <p className="text-sm text-muted-foreground">Mentoreada | Inicio: {new Date(m.startDate).toLocaleDateString('es-ES')}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.status === 'active' ? 'bg-green-500/80 text-white' : 'bg-gray-500 text-white'}`}>
                                        {m.status === 'active' ? 'Activa' : 'Completada'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center py-4">Esta mentora aún no ha tenido ninguna mentoría.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MentorDetailsModal;