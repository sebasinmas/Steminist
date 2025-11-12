import React from 'react';
import type { UserRole, Session, ConnectionRequest } from '../types';
import SessionCard from '../components/dashboard/SessionCard';
import ConnectionRequestCard from '../components/notifications/ConnectionRequestCard';

interface NotificationsPageProps {
    userRole: UserRole;
    sessions: Session[];
    connectionRequests: ConnectionRequest[];
    updateSessionStatus: (sessionId: number, newStatus: Session['status']) => void;
    updateConnectionStatus: (requestId: number, newStatus: 'accepted' | 'declined') => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ userRole, sessions, connectionRequests, updateSessionStatus, updateConnectionStatus }) => {
    
    const relevantSessionNotifications = sessions.filter(s =>
        (userRole === 'mentor' && s.status === 'pending') ||
        (userRole === 'mentee' && s.status === 'needs_confirmation')
    );
    
    const relevantConnectionRequests = connectionRequests.filter(cr =>
        userRole === 'mentor' && cr.status === 'pending'
    );

    const hasNotifications = relevantSessionNotifications.length > 0 || relevantConnectionRequests.length > 0;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-8">Notificaciones</h1>
            
            {hasNotifications ? (
                <div className="space-y-10">
                    {relevantConnectionRequests.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Solicitudes de Conexión</h2>
                             {relevantConnectionRequests.map(request => (
                                <ConnectionRequestCard key={request.id} request={request} onStatusChange={updateConnectionStatus} />
                            ))}
                        </div>
                    )}

                    {relevantSessionNotifications.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Solicitudes de Sesión</h2>
                            {relevantSessionNotifications.map(session => (
                                // FIX: Added the required 'onRequestTermination' prop to SessionCard. Since sessions on this page are not confirmed, a no-op function is sufficient.
                                <SessionCard key={session.id} session={session} userRole={userRole} onStatusChange={updateSessionStatus} onRequestTermination={() => {}} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                    <h2 className="text-2xl font-semibold mb-2">¡Todo al día!</h2>
                    <p className="text-muted-foreground">No tienes notificaciones nuevas.</p>
                </div>
            )}

            {/* In a real app, you'd also show other notifications here, e.g., session confirmations, cancellations, etc. */}
        </div>
    );
};

export default NotificationsPage;