import React from 'react';
import type { ConnectionRequest } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import { useToast } from '../../context/ToastContext';

interface ConnectionRequestCardProps {
    avatarUrl: string;
    request: ConnectionRequest;
    onStatusChange: (requestId: number, newStatus: 'accepted' | 'declined') => void;
}

const ConnectionRequestCard: React.FC<ConnectionRequestCardProps> = ({avatarUrl, request, onStatusChange }) => {
    const { mentee, motivationLetter } = request;
    const { addToast } = useToast();

    const handleAccept = () => {
        onStatusChange(request.id, 'accepted');
        addToast(`Conexión con ${mentee.name} aceptada.`, 'success');
    };

    const handleDecline = () => {
        onStatusChange(request.id, 'declined');
        addToast(`Conexión con ${mentee.name} rechazada.`, 'info');
    };

    return (
        <Card>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex items-center space-x-4">
                    <img src={avatarUrl} alt={mentee.name} className="w-16 h-16 rounded-full flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold">Nueva Solicitud de Conexión</h3>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{mentee.name}</span> quiere conectar contigo.
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 self-start md:self-center flex-shrink-0">
                    <Button onClick={handleAccept} size="sm" variant="primary">Aceptar</Button>
                    <Button onClick={handleDecline} size="sm" variant="secondary">Rechazar</Button>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-sm mb-2">Detalles de la Solicitud:</h4>
                <p className="text-sm text-foreground/80 bg-secondary p-3 rounded-md italic whitespace-pre-line">{motivationLetter}</p>
            </div>
        </Card>
    );
};

export default ConnectionRequestCard;