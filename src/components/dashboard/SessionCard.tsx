import React from 'react';
import type { Session, UserRole } from '../../types';
import { CalendarIcon, ClockIcon } from '../common/Icons';
import Button from '../common/Button';
import Card from '../common/Card';
import { Avatar } from '../common/Avatar';

interface SessionCardProps {
    session: Session;
    userRole: UserRole;
    onStatusChange: (sessionId: number, newStatus: Session['status']) => void;
    onRequestTermination: (session: Session) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, userRole, onStatusChange, onRequestTermination }) => {
    const isMentor = userRole === 'mentor';
    const otherParty = isMentor ? session.mentee : session.mentor;

    const renderStatusBadge = () => {
        const statusInfo: Record<Session['status'], { text: string; color: string; }> = {
            pending: { text: 'Pendiente de Aprobación', color: 'bg-yellow-500' },
            confirmed: { text: 'Confirmada', color: 'bg-green-500' },
            completed: { text: 'Completada', color: 'bg-gray-500' },
            cancelled: { text: 'Cancelada', color: 'bg-red-500' },
            needs_confirmation: { text: 'Necesita tu Confirmación', color: 'bg-blue-500' },
            rescheduled: { text: 'Reprogramada', color: 'bg-purple-500' },
            termination_requested: { text: 'Terminación Solicitada', color: 'bg-orange-500' },
        };
        const { text, color } = statusInfo[session.status];
        return <span className={`text-white text-xs font-bold px-2.5 py-1 rounded-full ${color} text-center`}>{text}</span>;
    };

    const ConfidentialInfo: React.FC = () => (
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
            {session.mentee.pronouns && <p>Pronombres: <span className="font-semibold text-foreground">{session.mentee.pronouns}</span></p>}
            {session.mentee.neurodivergence && <p>Neurodivergencia: <span className="font-semibold text-foreground">{session.mentee.neurodivergence}</span></p>}
        </div>
    );

    const renderActions = () => {
        if (session.status === 'pending' && userRole === 'mentor') {
            return (
                <div className="flex space-x-2 mt-4">
                    <Button onClick={() => onStatusChange(session.id, 'confirmed')} size="sm" variant="primary">Aceptar</Button>
                    <Button onClick={() => onStatusChange(session.id, 'cancelled')} size="sm" variant="secondary">Rechazar</Button>
                </div>
            );
        }
        if (session.status === 'needs_confirmation' && userRole === 'mentee') {
            return (
                <div className="flex space-x-2 mt-4">
                    <Button onClick={() => onStatusChange(session.id, 'confirmed')} size="sm" variant="primary">Confirmar Hora</Button>
                    <Button onClick={() => onStatusChange(session.id, 'cancelled')} size="sm" variant="secondary">Cancelar Solicitud</Button>
                </div>
            );
        }
        if (session.status === 'confirmed') {
            return (
                <div className="flex space-x-2 mt-4">
                    <Button onClick={() => onRequestTermination(session)} size="sm" variant="ghost" className="text-red-500">Solicitar Terminación</Button>
                </div>
            )
        }
        return null;
    };

    return (
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-4">
                <Avatar src={otherParty.avatarUrl} alt={otherParty.name} className="w-16 h-16" />
                <div>
                    <h3 className="text-lg font-bold">{session.topic}</h3>
                    <p className="text-sm text-muted-foreground">Con {otherParty.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center space-x-1">
                            <CalendarIcon />
                            <span>{new Date(session.date).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <ClockIcon />
                            <span>{session.time}</span>
                        </div>
                    </div>
                    {isMentor && session.status === 'confirmed' && <ConfidentialInfo />}
                </div>
            </div>
            <div className="w-full md:w-auto flex flex-col items-center md:items-end">
                {renderStatusBadge()}
                {renderActions()}
            </div>
        </Card>
    );
};

export default SessionCard;