import React from 'react';
import type { ConnectionRequest } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import { useToast } from '../../context/ToastContext';

interface AdminRequestCardProps {
    request: ConnectionRequest;
    onStatusChange: (requestId: number, newStatus: 'accepted' | 'rejected') => void;
    mentorCurrentMentees: number;
}

const AdminRequestCard: React.FC<AdminRequestCardProps> = ({ request, onStatusChange, mentorCurrentMentees }) => {
    const { id, mentee, mentor, motivationLetter } = request;
    const isAtCapacity = mentorCurrentMentees >= mentor.maxMentees;
    const { addToast } = useToast();

    const handleApprove = () => {
        onStatusChange(request.id, 'accepted');
    };

    const handleDecline = () => {
        onStatusChange(request.id, 'rejected');
    };

    return (
        <Card>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-muted-foreground">ID de Solicitud: {id}</p>
                    <p><strong>Mentoreada:</strong> {mentee.name}</p>
                    <p><strong>Mentora:</strong> {mentor.name}</p>
                    <div className={`text-sm font-semibold mt-1 ${isAtCapacity ? 'text-red-500' : 'text-green-500'}`}>
                        Capacidad: {mentorCurrentMentees} / {mentor.maxMentees}
                    </div>
                </div>
                 <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button onClick={handleApprove} size="sm" variant="primary" disabled={isAtCapacity} title={isAtCapacity ? "La mentora ha alcanzado su capacidad máxima" : ""}>Aprobar</Button>
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

export default AdminRequestCard;