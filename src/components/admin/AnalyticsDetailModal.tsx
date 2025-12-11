import React, { useMemo } from 'react';
import type { Session, Mentorship } from '../../types';
import Card from '../common/Card';
import { XIcon, StarIcon, ClockIcon, CalendarIcon } from '../common/Icons';
import Tag from '../common/Tag';
import { SURVEY_OPTIONS } from '../../utils/constants';
import { Avatar } from '../common/Avatar';

interface AnalyticsDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentorship: Mentorship | null;
}

const getStatusPill = (status: Session['status']) => {
    const styles: Record<Session['status'], string> = {
        confirmed: "bg-green-500/80 text-white",
        completed: "bg-gray-500 text-white",
        pending: "bg-yellow-500/80 text-white",
        cancelled: "bg-red-500/80 text-white",
        needs_confirmation: "bg-blue-500/80 text-white",
        rescheduled: "bg-purple-500/80 text-white",
        // FIX: Added style for the new 'termination_requested' status to match changes in types.ts
        termination_requested: "bg-orange-500/80 text-white",
        active: "bg-blue-600 text-white"
    };
    return <Tag className={styles[status]}>{status.replace('_', ' ')}</Tag>;
};


const AnalyticsDetailModal: React.FC<AnalyticsDetailModalProps> = ({ isOpen, onClose, mentorship }) => {
    if (!isOpen || !mentorship) return null;

    const { mentor, mentee, sessions } = mentorship;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-6 m-4 max-w-4xl w-full transform transition-all flex flex-col h-[90vh]">

                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-border">
                    <div className="flex items-center justify-between flex-grow">
                        <div className="flex items-center space-x-4">
                            <Avatar src={mentor.avatarUrl} alt={mentor.name} className="w-16 h-16" />
                            <div>
                                <h3 className="font-bold">Mentora</h3>
                                <p className="text-lg">{mentor.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <h3 className="font-bold">Mentoreada</h3>
                                <p className="text-lg">{mentee.name}</p>
                            </div>
                            <Avatar src={mentee.avatarUrl} alt={mentee.name} className="w-16 h-16" />
                        </div>
                    </div>
                    <button onClick={onClose} className="ml-4 flex-shrink-0 text-muted-foreground hover:text-foreground">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto pr-2 mt-4">
                    <h3 className="text-xl font-semibold mb-4">Historial de Sesiones</h3>
                    {sessions.length > 0 ? (
                        <div className="space-y-4">
                            {sessions.sort((a, b) => a.sessionNumber - b.sessionNumber).map(session => (
                                <Card key={session.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg">Sesión {session.sessionNumber}: {session.topic}</h4>
                                        {getStatusPill(session.status)}
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                        <div className="flex items-center space-x-1"><CalendarIcon /><span>{new Date(session.date).toLocaleDateString('es-ES')}</span></div>
                                        <div className="flex items-center space-x-1"><ClockIcon /><span>{session.time}</span></div>
                                    </div>

                                    {session.attachments && session.attachments.length > 0 && (
                                        <div className="mt-3">
                                            <h5 className="font-semibold text-sm">Archivos Adjuntos:</h5>
                                            <ul className="list-disc list-inside text-sm">
                                                {session.attachments.map(file => <li key={file.name}>{file.name}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {session.status === 'completed' && (session.mentorSurvey || session.feedback) && (
                                        <div className="mt-3 pt-3 border-t border-border text-sm space-y-2">
                                            {session.feedback && (
                                                <div>
                                                    <h5 className="font-semibold text-sm">Feedback de Mentoreada:</h5>
                                                    <div className="flex items-center gap-1">
                                                        <span className="flex items-center text-yellow-500">
                                                            {Array.from({ length: session.rating || 0 }).map((_, i) => <StarIcon key={i} className="w-4 h-4 fill-current" />)}
                                                        </span>
                                                        <span className="italic">"{session.feedback}"</span>
                                                    </div>
                                                </div>
                                            )}
                                            {session.mentorSurvey && (
                                                <div>
                                                    <h5 className="font-semibold text-sm">Feedback de Mentora:</h5>
                                                    <p><strong>Preparación:</strong> {SURVEY_OPTIONS[session.mentorSurvey.preparation]}</p>
                                                    <p><strong>Compromiso:</strong> {SURVEY_OPTIONS[session.mentorSurvey.engagement]}</p>
                                                    <p className="italic"><strong>Resultado:</strong> "{session.mentorSurvey.outcome}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No se han agendado sesiones para esta mentoría.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDetailModal;