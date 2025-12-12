import React, { useState } from 'react';
import type { ConnectionRequest } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import { Avatar } from '../common/Avatar';

interface ConnectionRequestCardProps {
    request: ConnectionRequest;
    onStatusChange: (requestId: number, newStatus: 'accepted' | 'rejected') => Promise<void>;
}

const ConnectionRequestCard: React.FC<ConnectionRequestCardProps> = ({ request, onStatusChange }) => {
    const { mentee, motivationLetter } = request;
    const [submitting, setSubmitting] = useState(false);

    const handleAccept = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (submitting) return;

        setSubmitting(true);
        try {
            await onStatusChange(request.id, 'accepted');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecline = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (submitting) return;

        setSubmitting(true);
        try {
            await onStatusChange(request.id, 'rejected');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex items-center space-x-4">
                    <Avatar src={mentee.avatarUrl} alt={mentee.name} className="w-16 h-16 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold">Nueva Solicitud de Conexión</h3>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{mentee.name}</span> quiere conectar contigo.
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 self-start md:self-center flex-shrink-0">
                    <Button onClick={handleAccept} size="sm" variant="primary" disabled={submitting}>
                        Aceptar
                    </Button>
                    <Button onClick={handleDecline} size="sm" variant="secondary" disabled={submitting}>
                        Rechazar
                    </Button>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-sm mb-2">Detalles de la Solicitud:</h4>
                <p className="text-sm text-foreground/80 bg-secondary p-3 rounded-md italic whitespace-pre-line">
                    {motivationLetter}
                </p>
            </div>
        </Card>
    );
};

export default ConnectionRequestCard;