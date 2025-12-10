import React from 'react';
import type { Session, ConnectionRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import SessionCard from '../components/dashboard/SessionCard';
import ConnectionRequestCard from '../components/notifications/ConnectionRequestCard';
import { Notifications, notificationService } from '@/services/notificationService';

interface NotificationsPageProps {
    sessions: Session[];
    connectionRequests: ConnectionRequest[];
    updateSessionStatus: (sessionId: number, newStatus: Session['status']) => void;
    updateConnectionStatus: (requestId: number, newStatus: 'accepted' | 'declined') => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = async ({ sessions, connectionRequests, updateSessionStatus, updateConnectionStatus }) => {
    const { role, user } = useAuth();
    const Notifications: Notifications = await notificationService.fetchNotifications(user.id, role!);
    const relevantSessionNotifications = Notifications['sessions'];
    const relevantConnectionRequests = Notifications['connectionRequests'];

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
                                <ConnectionRequestCard avatarUrl={request.avatarUrl} key={request.menteeId} request={request} onStatusChange={updateConnectionStatus} />
                            ))}
                        </div>
                    )}

                    {relevantSessionNotifications.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Solicitudes de Sesión</h2>
                            {relevantSessionNotifications.map(session => (
                                <SessionCard avatarUrl={session.avatarUrl} key={session.id} session={session} userRole={role!} onStatusChange={updateSessionStatus} onRequestTermination={() => {}} />
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
        </div>
    );
};

export default NotificationsPage;