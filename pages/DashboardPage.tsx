import React, { useState, useMemo, useEffect } from 'react';
import type { UserRole, Mentor, Mentee, Page, Mentorship, Session, MentorSurvey, Attachment } from '../types';
import { POSITIVE_AFFIRMATIONS } from '../../constants';
import AffirmationCard from '../components/dashboard/AffirmationCard';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import MentorshipProgress from '../components/dashboard/MentorshipProgress';
import SchedulingModal from '../components/scheduling/SchedulingModal';
import MentorSurveyModal from '../components/dashboard/MentorSurveyModal';
import MentorProfileDetails from '../components/dashboard/MentorProfileDetails';
import MentorConnectionsCard from '../components/dashboard/MentorConnectionsCard';
import TerminationRequestModal from '../components/dashboard/TerminationRequestModal';
import { useToast } from '../context/ToastContext';

interface DashboardPageProps {
    userRole: UserRole;
    currentUser: Mentor | Mentee;
    mentorships: Mentorship[];
    navigateTo: (page: Page, data?: Mentor | Mentee) => void;
    addSession: (mentorshipId: number, newSession: Omit<Session, 'id' | 'sessionNumber'>) => void;
    updateMentorshipSession: (mentorshipId: number, sessionId: number, updates: Partial<Session>) => void;
    addAttachmentToSession: (mentorshipId: number, sessionId: number, attachment: Attachment) => void;
    addSurveyToSession: (mentorshipId: number, sessionId: number, survey: MentorSurvey) => void;
    requestMentorshipTermination: (mentorshipId: number, reasons: string[], details: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const { userRole, currentUser, mentorships, navigateTo, addSession, requestMentorshipTermination } = props;
    const isMentor = userRole === 'mentor';
    const { addToast } = useToast();
    
    const myMentorships = useMemo(() => {
        return mentorships.filter(m => 
            isMentor ? m.mentor.id === currentUser.id : m.mentee.id === currentUser.id
        );
    }, [mentorships, currentUser, isMentor]);

    // General State
    const [isScheduling, setIsScheduling] = useState(false);
    const [activeMentorshipForScheduling, setActiveMentorshipForScheduling] = useState<Mentorship | null>(null);
    const [sessionForSurvey, setSessionForSurvey] = useState<{mentorshipId: number, session: Session} | null>(null);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const randomAffirmation = useMemo(() => POSITIVE_AFFIRMATIONS[Math.floor(Math.random() * POSITIVE_AFFIRMATIONS.length)], []);

    // Mentor-specific state
    const activeMentorships = useMemo(() => myMentorships.filter(m => m.status === 'active'), [myMentorships]);
    const [selectedMentorship, setSelectedMentorship] = useState<Mentorship | null>(null);
    const [terminatingMentorship, setTerminatingMentorship] = useState<Mentorship | null>(null);

    useEffect(() => {
        if (isMentor) {
            // On load, select the first active mentorship if none is selected
            if (!selectedMentorship && activeMentorships.length > 0) {
                setSelectedMentorship(activeMentorships[0]);
            }
            // If the selected mentorship is no longer active, clear selection
            if (selectedMentorship && !activeMentorships.find(m => m.id === selectedMentorship.id)) {
                setSelectedMentorship(activeMentorships[0] || null);
            }
        }
    }, [isMentor, activeMentorships, selectedMentorship]);


    const handleScheduleClick = (mentorship: Mentorship) => {
        setActiveMentorshipForScheduling(mentorship);
        setIsScheduling(true);
    };

    const handleSessionBooked = (session: Omit<Session, 'id' | 'sessionNumber'>) => {
        if (activeMentorshipForScheduling) {
            addSession(activeMentorshipForScheduling.id, session);
            addToast('Sesión agendada. La mentora ha sido notificada.', 'success');
        }
        setIsScheduling(false);
        setActiveMentorshipForScheduling(null);
    };

    const handleOpenSurvey = (mentorshipId: number, session: Session) => {
        setSessionForSurvey({ mentorshipId, session });
        setIsSurveyModalOpen(true);
    };

    const handleSurveySubmit = (surveyData: MentorSurvey) => {
        if (sessionForSurvey) {
            props.addSurveyToSession(sessionForSurvey.mentorshipId, sessionForSurvey.session.id, surveyData);
            addToast('Feedback enviado. ¡Gracias por tu contribución!', 'success');
        }
        setIsSurveyModalOpen(false);
        setSessionForSurvey(null);
    };

    const handleTerminationRequest = (reasons: string[], details: string) => {
        if (terminatingMentorship) {
            requestMentorshipTermination(terminatingMentorship.id, reasons, details);
            addToast('Solicitud de terminación enviada para revisión.', 'info');
        }
        setTerminatingMentorship(null);
    };
    
    const MatchImprovementCard = () => (
        <Card className="bg-secondary/50">
            <h3 className="font-bold text-lg">
                {isMentor ? 'Atrae a las mentoreadas ideales' : '¡Mejora tus Matches!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
                 {isMentor ? 'Actualiza tus temas de mentoría para que las mentoreadas adecuadas te encuentren.' : 'Actualiza tus intereses y objetivos para encontrar a la mentora perfecta para ti.'}
            </p>
            <Button size="sm" variant="secondary" onClick={() => navigateTo('profile_self')}>Actualizar Mi Perfil</Button>
        </Card>
    );


    if (isMentor) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-3 space-y-6 sticky top-28 hidden lg:block">
                       <MentorProfileDetails mentor={currentUser as Mentor} />
                    </div>

                    {/* Center Column */}
                    <div className="lg:col-span-6 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>
                            {selectedMentorship ? (
                                <MentorshipProgress 
                                    key={selectedMentorship.id}
                                    mentorship={selectedMentorship}
                                    userRole={userRole}
                                    onScheduleSession={() => handleScheduleClick(selectedMentorship)}
                                    onUpdateSession={props.updateMentorshipSession}
                                    onAddAttachment={props.addAttachmentToSession}
                                    onCompleteSession={handleOpenSurvey}
                                    onShowTerminationModal={() => setTerminatingMentorship(selectedMentorship)}
                                />
                            ) : activeMentorships.length > 0 ? (
                                <Card>
                                    <div className="text-center py-8">
                                        <h3 className="text-xl font-semibold">Bienvenida a tu panel</h3>
                                        <p className="text-muted-foreground mt-2">Selecciona una mentoreada de la lista para ver los detalles de la mentoría.</p>
                                    </div>
                                </Card>
                            ) : (
                                <Card>
                                     <div className="text-center py-8">
                                        <h3 className="text-xl font-semibold">Todo listo para empezar</h3>
                                        <p className="text-muted-foreground mt-2">Cuando aceptes una solicitud de conexión, tu mentoreada aparecerá aquí.</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold mt-10">Mentorías Completadas</h2>
                             {myMentorships.filter(m => m.status === 'completed').length > 0 ? (
                                myMentorships.filter(m => m.status === 'completed').map(m => (
                                   <MentorshipProgress 
                                        key={m.id}
                                        mentorship={m}
                                        userRole={userRole}
                                        onScheduleSession={() => {}}
                                        onUpdateSession={() => {}}
                                        onAddAttachment={() => {}}
                                        onCompleteSession={() => {}}
                                        onShowTerminationModal={() => {}}
                                    />
                                ))
                            ) : (
                                <Card><p className="text-muted-foreground">Aún no has completado ninguna mentoría.</p></Card>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-3 space-y-6 sticky top-28">
                         <MentorConnectionsCard
                             mentorships={activeMentorships}
                             onSelectMentorship={setSelectedMentorship}
                             selectedMentorshipId={selectedMentorship?.id}
                         />
                         <AffirmationCard affirmation={randomAffirmation} />
                         <MatchImprovementCard />
                    </div>
                </div>

                {activeMentorshipForScheduling && (
                    <SchedulingModal
                        mentor={activeMentorshipForScheduling.mentor}
                        isOpen={isScheduling}
                        onClose={() => setIsScheduling(false)}
                        onSessionBook={handleSessionBooked}
                    />
                )}
                
                {sessionForSurvey && (
                    <MentorSurveyModal
                        isOpen={isSurveyModalOpen}
                        onClose={() => setIsSurveyModalOpen(false)}
                        onSubmit={handleSurveySubmit}
                    />
                )}

                {terminatingMentorship && (
                    <TerminationRequestModal
                        isOpen={!!terminatingMentorship}
                        onClose={() => setTerminatingMentorship(null)}
                        onSubmit={handleTerminationRequest}
                        mentorship={terminatingMentorship}
                    />
                )}
            </div>
        );
    }
    
    // MENTEE DASHBOARD VIEW
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-4xl font-bold">
                    ¡Hola de nuevo, {currentUser.name.split(' ')[0]}!
                </h1>
                <p className="text-lg text-muted-foreground mt-2">Gestiona tus mentorías y sigue tu progreso.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-semibold">Mis Mentorías Activas</h2>
                    {myMentorships.filter(m => m.status === 'active').length > 0 ? (
                        myMentorships.filter(m => m.status === 'active').map(m => (
                            <MentorshipProgress 
                                key={m.id}
                                mentorship={m}
                                userRole={userRole}
                                onScheduleSession={() => handleScheduleClick(m)}
                                onUpdateSession={props.updateMentorshipSession}
                                onAddAttachment={props.addAttachmentToSession}
                                onCompleteSession={handleOpenSurvey}
                                onShowTerminationModal={() => {}} // Not used for mentee
                            />
                        ))
                    ) : (
                        <Card>
                            <div className="text-center py-8">
                                <h3 className="text-xl font-semibold">Todo listo para empezar</h3>
                                <p className="text-muted-foreground mt-2 mb-4">Aún no tienes mentorías activas. ¡Encuentra una mentora para comenzar!</p>
                                <Button onClick={() => navigateTo('discover')}>Descubrir Mentoras</Button>
                            </div>
                        </Card>
                    )}

                    <h2 className="text-2xl font-semibold mt-10">Mentorías Completadas</h2>
                     {myMentorships.filter(m => m.status === 'completed').length > 0 ? (
                        myMentorships.filter(m => m.status === 'completed').map(m => (
                           <MentorshipProgress 
                                key={m.id}
                                mentorship={m}
                                userRole={userRole}
                                onScheduleSession={() => {}}
                                onUpdateSession={() => {}}
                                onAddAttachment={() => {}}
                                onCompleteSession={() => {}}
                                onShowTerminationModal={() => {}} // Not used for mentee
                            />
                        ))
                    ) : (
                        <Card><p className="text-muted-foreground">Aún no has completado ninguna mentoría.</p></Card>
                    )}
                </div>
                <div className="space-y-6 sticky top-28">
                    <AffirmationCard affirmation={randomAffirmation} />
                    <MatchImprovementCard />
                </div>
            </div>

            {activeMentorshipForScheduling && (
                <SchedulingModal
                    mentor={activeMentorshipForScheduling.mentor}
                    isOpen={isScheduling}
                    onClose={() => setIsScheduling(false)}
                    onSessionBook={handleSessionBooked}
                />
            )}
            
            {/* Mentee doesn't use MentorSurveyModal */}

        </div>
    );
};

export default DashboardPage;