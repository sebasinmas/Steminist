import React from 'react';
import type { SupportTicket } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../common/Avatar';

interface SupportTicketCardProps {
    ticket: SupportTicket;
    onUpdateStatus: (ticketId: number, status: 'resolved') => void;
}

const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ ticket, onUpdateStatus }) => {
    const { addToast } = useToast();

    const handleResolve = () => {
        onUpdateStatus(ticket.id, 'resolved');
        addToast(`Consulta de ${ticket.user.name} marcada como resuelta.`, 'success');
    };

    return (
        <Card>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                    <Avatar src={ticket.user.avatarUrl} alt={ticket.user.name} className="w-10 h-10" />
                    <div>
                        <p className="font-bold">{ticket.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {new Date(ticket.timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    </div>
                </div>
                <Button size="sm" onClick={handleResolve}>Marcar como Resuelto</Button>
            </div>
            <div>
                <h4 className="font-semibold text-md mb-1">{ticket.subject}</h4>
                <p className="text-sm text-foreground/80 bg-secondary p-3 rounded-md whitespace-pre-line">{ticket.message}</p>
            </div>
        </Card>
    );
};

export default SupportTicketCard;
