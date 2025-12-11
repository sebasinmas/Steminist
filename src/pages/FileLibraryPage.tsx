import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mentorship } from '../types';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ChevronLeftIcon, DocumentTextIcon } from '../components/common/Icons';
import { Avatar } from '../components/common/Avatar';

interface FileLibraryPageProps {
    mentorships: Mentorship[];
}

const FileLibraryPage: React.FC<FileLibraryPageProps> = ({ mentorships }) => {
    const { user, role } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const myMentorships = mentorships.filter(m =>
        role === 'mentor' ? m.mentor.id === user.id : m.mentee.id === user.id
    );

    const renderSessionFiles = (mentorshipId: number, sessionNumber: number) => {
        const mentorship = myMentorships.find(m => m.id === mentorshipId);
        const session = mentorship?.sessions.find(s => s.sessionNumber === sessionNumber);

        if (session && session.attachments && session.attachments.length > 0) {
            return (
                <ul className="list-none space-y-2">
                    {session.attachments.map((file, index) => (
                        <li key={index}>
                            <a href={file.url} download className="flex items-center space-x-2 text-primary hover:underline">
                                <DocumentTextIcon className="w-5 h-5" />
                                <span>{file.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            );
        }
        return <p className="text-muted-foreground text-sm">No hay archivos para esta sesión.</p>;
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-8 flex items-center">
                <ChevronLeftIcon className="mr-2 h-5 w-5" />
                Volver al Panel de Control
            </Button>
            <h1 className="text-4xl font-bold mb-2">Biblioteca de Archivos</h1>
            <p className="text-lg text-muted-foreground mb-8">Todos los documentos de tus mentorías en un solo lugar.</p>

            <div className="space-y-8">
                {myMentorships.map(mentorship => {
                    const otherParty = role === 'mentor' ? mentorship.mentee : mentorship.mentor;
                    return (
                        <Card key={mentorship.id} className="p-0 overflow-hidden">
                            <div className="bg-secondary p-4 flex items-center space-x-4">
                                <Avatar src={otherParty.avatarUrl} alt={otherParty.name} className="w-12 h-12" />
                                <div>
                                    <h2 className="text-xl font-bold">Mentoría con {otherParty.name}</h2>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${mentorship.status === 'active' ? 'bg-green-500/80 text-white' : 'bg-gray-500 text-white'}`}>
                                        {mentorship.status === 'active' ? 'Activa' : 'Completada'}
                                    </span>
                                </div>
                            </div>
                            <div className="divide-y divide-border">
                                {[1, 2, 3].map(sessionNumber => {
                                    const session = mentorship.sessions.find(s => s.sessionNumber === sessionNumber);
                                    const sessionTitle = session ? `Sesión ${sessionNumber}: ${session.topic}` : `Sesión ${sessionNumber}: Por agendar`;
                                    return (
                                        <div key={sessionNumber} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <h3 className="font-semibold md:col-span-1">{sessionTitle}</h3>
                                            <div className="md:col-span-2">
                                                {renderSessionFiles(mentorship.id, sessionNumber)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}
                {myMentorships.length === 0 && (
                    <Card>
                        <p className="text-muted-foreground text-center py-8">Aún no tienes archivos en tu biblioteca.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default FileLibraryPage;