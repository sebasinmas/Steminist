import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mentor, ConnectionStatus } from '../../types';
import Button from '../components/common/Button';
import Tag from '../components/common/Tag';
import ConnectionRequestModal from '../components/mentors/ConnectionRequestModal';
import { CheckCircleIcon, LinkIcon } from '../components/common/Icons';
import { useToast } from '../context/ToastContext';

interface MentorProfilePageProps {
    mentor: Mentor;
    connectionStatus: ConnectionStatus;
    onSendConnectionRequest: (mentor: Mentor, motivationLetter: string) => void;
}

const MentorProfilePage: React.FC<MentorProfilePageProps> = ({ mentor, connectionStatus, onSendConnectionRequest }) => {
    const [isRequestingConnection, setIsRequestingConnection] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();
    
    const handleSendRequest = (motivationLetter: string) => {
        onSendConnectionRequest(mentor, motivationLetter);
        setIsRequestingConnection(false);
        addToast('Solicitud de conexión enviada con éxito.', 'success');
    };

    const renderActionButton = () => {
        switch (connectionStatus) {
            case 'none':
                return <Button onClick={() => setIsRequestingConnection(true)} size="lg" className="w-full">Enviar Solicitud de Conexión</Button>;
            case 'pending':
                return <Button size="lg" className="w-full" disabled>Solicitud Enviada</Button>;
            case 'connected':
                return <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full">Ir al Panel para Agendar</Button>;
            case 'declined':
                 return <Button size="lg" className="w-full" disabled>Conexión Rechazada</Button>;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Button variant="ghost" onClick={() => navigate('/discover')} className="mb-8">&larr; Volver a la búsqueda</Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1">
                    <div className="sticky top-28 bg-card p-8 rounded-lg border border-border text-center">
                        <img src={mentor.avatarUrl} alt={mentor.name} className="w-40 h-40 rounded-full mx-auto mb-4" />
                        <h1 className="text-3xl font-bold">{mentor.name}</h1>
                        <p className="text-lg text-primary">{mentor.title}</p>
                        <p className="text-md text-muted-foreground mb-4">{mentor.company}</p>
                        <div className="text-lg mb-4">
                            <span className="font-bold text-yellow-500">★ {mentor.rating.toFixed(1)}</span>
                            <span className="text-muted-foreground"> ({mentor.reviews} reseñas)</span>
                        </div>
                        {connectionStatus === 'connected' && (
                             <div className="inline-flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm mb-4">
                                <CheckCircleIcon />
                                <span>Conectada</span>
                            </div>
                        )}
                        {renderActionButton()}
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Acerca de {mentor.name}</h2>
                        <p className="text-lg text-foreground/90 whitespace-pre-line">{mentor.longBio}</p>
                    </div>
                    
                    {mentor.links && mentor.links.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Publicaciones y Enlaces</h2>
                            <div className="space-y-3">
                                {mentor.links.map((link, index) => (
                                    <a 
                                        key={index}
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-primary hover:underline bg-secondary/50 p-3 rounded-md transition-colors hover:bg-secondary"
                                    >
                                        <LinkIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-semibold truncate">{link.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Áreas de Especialización</h2>
                        <div className="flex flex-wrap">
                            {mentor.expertise.map(tag => <Tag key={tag} className="text-base px-4 py-2">{tag}</Tag>)}
                        </div>
                    </div>
                     <div>
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Disponibilidad</h2>
                        <p className="text-muted-foreground mb-4">La mentora está disponible en las siguientes fechas. Los horarios están en tu zona horaria local.</p>
                        <div className="flex flex-wrap gap-4">
                            {Object.keys(mentor.availability).map(date => (
                                <div key={date} className="bg-secondary text-secondary-foreground rounded-lg p-3 text-center">
                                    <p className="font-bold">{new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</p>
                                    <p className="text-sm">{new Date(date).toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ConnectionRequestModal
                mentor={mentor}
                isOpen={isRequestingConnection}
                onClose={() => setIsRequestingConnection(false)}
                onSendRequest={handleSendRequest}
            />
        </div>
    );
};

export default MentorProfilePage;