import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mentor, Mentee, Mentorship, Session, MentorSurvey, Attachment } from '../types';
import { useAuth } from '../context/AuthContext';
import { POSITIVE_AFFIRMATIONS } from '../utils/constants';
import AffirmationCard from '../components/dashboard/AffirmationCard';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import MentorshipProgress from '../components/dashboard/MentorshipProgress';
import SchedulingModal from '../components/scheduling/SchedulingModal';
import MentorSurveyModal from '../components/dashboard/MentorSurveyModal';
import MentorProfileDetails from '../components/dashboard/MentorProfileDetails';
import MentorConnectionsCard from '../components/dashboard/MentorConnectionsCard';
import TerminationRequestModal from '../components/dashboard/TerminationRequestModal';
import HelpCenterCard from '../components/dashboard/HelpCenterCard';
import ContactSupportModal from '../components/dashboard/ContactSupportModal';
import { useToast } from '../context/ToastContext';
import SessionFeedbackModal from '@/components/dashboard/SessionFeedbackModal';

interface DashboardPageProps {
    mentorships: Mentorship[];
    addSession: (mentorshipId: number, newSession: Omit<Session, 'id' | 'sessionNumber'>) => void;
    updateMentorshipSession: (mentorshipId: number, sessionId: number, updates: Partial<Session>) => void;
    addAttachmentToSession: (mentorshipId: number, sessionId: number, attachment: Attachment) => void;
    addSurveyToSession: (mentorshipId: number, sessionId: number, survey: MentorSurvey) => void;
    requestMentorshipTermination: (mentorshipId: number, reasons: string[], details: string) => void;
    submitSupportTicket: (subject: string, message: string) => Promise<void>;
    onSubmitSessionFeedback?: (sessionId: number, rating: number, comment: string) => Promise<void>;
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const { mentorships, addSession, requestMentorshipTermination, submitSupportTicket } = props;
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const isMentor = role === 'mentor';
    const { addToast } = useToast();

    const currentUser = user as Mentor | Mentee;

    const myMentorships = useMemo(() => {
        if (!currentUser) return [];
        return mentorships.filter(m =>
            isMentor ? m.mentor.id === currentUser.id : m.mentee.id === currentUser.id
        );
    }, [mentorships, currentUser, isMentor]);

    // General State
    const [isScheduling, setIsScheduling] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [activeMentorshipForScheduling, setActiveMentorshipForScheduling] = useState<Mentorship | null>(null);
    const [sessionForSurvey, setSessionForSurvey] = useState<{ mentorshipId: number, session: Session } | null>(null);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const randomAffirmation = useMemo(() => POSITIVE_AFFIRMATIONS[Math.floor(Math.random() * POSITIVE_AFFIRMATIONS.length)], []);

    // Mentor-specific state
    const activeMentorships = useMemo(() => myMentorships.filter(m => m.status === 'active'), [myMentorships]);
    const [selectedMentorship, setSelectedMentorship] = useState<Mentorship | null>(null);
    const [terminatingMentorship, setTerminatingMentorship] = useState<Mentorship | null>(null);
    const [sessionForFeedback, setSessionForFeedback] = useState<Session | null>(null);

    useEffect(() => {
        if (isMentor) {
            if (!selectedMentorship && activeMentorships.length > 0) {
                setSelectedMentorship(activeMentorships[0]);
            }
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

    const handleSubmitSupportTicket = async (subject: string, message: string) => {
        try {
            await submitSupportTicket(subject, message);
            addToast('Tu consulta ha sido enviada. Te responderemos pronto.', 'success');
        } catch (error) {
            console.error('Error al enviar consulta:', error);
            addToast('Error al enviar la consulta. Por favor, intenta de nuevo.', 'error');
        }
    };

    const MatchImprovementCard = () => (
        <Card className="bg-secondary/50">
            <h3 className="font-bold text-lg">
                {isMentor ? 'Atrae a las mentoreadas ideales' : '¡Mejora tus Matches!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
                {isMentor ? 'Actualiza tus temas de mentoría para que las mentoreadas adecuadas te encuentren.' : 'Actualiza tus intereses y objetivos para encontrar a la mentora perfecta para ti.'}
            </p>
            <Button variant="secondary" onClick={() => navigate('/profile')}>Actualizar Mi Perfil</Button>
        </Card>
    );
    const handleOpenFeedback = (session: Session) => {
        setSessionForFeedback(session);
    };

    const handleFeedbackSubmit = async (rating: number, comment: string) => {
        if (sessionForFeedback && props.onSubmitSessionFeedback) {
            await props.onSubmitSessionFeedback(sessionForFeedback.id, rating, comment);
            setSessionForFeedback(null);
        }
    };

    if (isMentor) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-3 space-y-6 sticky top-28 hidden lg:block">
                        <MentorProfileDetails mentor={currentUser as Mentor} />
                    </div>
                    <div className="lg:col-span-6 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>
                            {selectedMentorship ? (
                                <MentorshipProgress
                                    key={selectedMentorship.id}
                                    mentorship={selectedMentorship}
                                    onScheduleSession={() => handleScheduleClick(selectedMentorship)}
                                    onUpdateSession={props.updateMentorshipSession}
                                    onAddAttachment={props.addAttachmentToSession}
                                    onCompleteSession={handleOpenSurvey}
                                    onShowTerminationModal={() => setTerminatingMentorship(selectedMentorship)}
                                    onLeaveFeedback={()=>{}}
                                />
                            ) : activeMentorships.length > 0 ? (
                                <Card><div className="text-center py-8"><h3 className="text-xl font-semibold">Bienvenida a tu panel</h3><p className="text-muted-foreground mt-2">Selecciona una mentoreada de la lista para ver los detalles.</p></div></Card>
                            ) : (
                                <Card><div className="text-center py-8"><h3 className="text-xl font-semibold">Todo listo para empezar</h3><p className="text-muted-foreground mt-2">Cuando aceptes una solicitud, tu mentoreada aparecerá aquí.</p></div></Card>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold mt-10">Mentorías Completadas</h2>
                            {myMentorships.filter(m => m.status === 'completed').length > 0 ? (
                                myMentorships.filter(m => m.status === 'completed').map(m => (<MentorshipProgress key={m.id} mentorship={m} onScheduleSession={() => { }} onUpdateSession={() => { }} onAddAttachment={() => { }} onCompleteSession={() => { }} onShowTerminationModal={() => { }} />))
                            ) : (
                                <Card><p className="text-muted-foreground">Aún no has completado ninguna mentoría.</p></Card>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-6 sticky top-28">
                        <MentorConnectionsCard mentorships={activeMentorships} onSelectMentorship={setSelectedMentorship} selectedMentorshipId={selectedMentorship?.id} />
                        <AffirmationCard affirmation={randomAffirmation} />
                        <HelpCenterCard onContactClick={() => setIsSupportModalOpen(true)} />
                        <MatchImprovementCard />
                    </div>
                </div>
                {activeMentorshipForScheduling && (<SchedulingModal mentor={activeMentorshipForScheduling.mentor} isOpen={isScheduling} onClose={() => setIsScheduling(false)} onSessionBook={handleSessionBooked} />)}
                {sessionForSurvey && (<MentorSurveyModal isOpen={isSurveyModalOpen} onClose={() => setIsSurveyModalOpen(false)} onSubmit={handleSurveySubmit} />)}
                {terminatingMentorship && (<TerminationRequestModal isOpen={!!terminatingMentorship} onClose={() => setTerminatingMentorship(null)} onSubmit={handleTerminationRequest} mentorship={terminatingMentorship} />)}
                <ContactSupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} onSubmit={handleSubmitSupportTicket} />
            </div>
        );
    }

    // MENTEE DASHBOARD VIEW
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-4xl font-bold">¡Hola de nuevo, {currentUser.name.split(' ')[0]}!</h1>
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
                                onScheduleSession={() => handleScheduleClick(m)}
                                onUpdateSession={props.updateMentorshipSession}
                                onAddAttachment={props.addAttachmentToSession}
                                onCompleteSession={handleOpenSurvey}
                                onShowTerminationModal={() => setTerminatingMentorship(m)}
                                onLeaveFeedback={handleOpenFeedback}
                            />
                        ))
                    ) : (
                        <Card>
                            <div className="text-center py-8">
                                <h3 className="text-xl font-semibold">Todo listo para empezar</h3>
                                <p className="text-muted-foreground mt-2 mb-4">Aún no tienes mentorías activas. ¡Encuentra una mentora!</p>
                                <Button onClick={() => navigate('/discover')}>Descubrir Mentoras</Button>
                            </div>
                        </Card>
                    )}
                    <h2 className="text-2xl font-semibold mt-10">Mentorías Completadas</h2>
                    {myMentorships.filter(m => m.status === 'completed').length > 0 ? (
                        myMentorships.filter(m => m.status === 'completed').map(m => (
                            <MentorshipProgress
                                key={m.id}
                                mentorship={m}
                                onScheduleSession={() => { }} onUpdateSession={() => { }} onAddAttachment={() => { }} onCompleteSession={() => { }} onShowTerminationModal={() => { }}
                            />
                        ))
                    ) : (
                        <Card><p className="text-muted-foreground">Aún no has completado ninguna mentoría.</p></Card>
                    )}
                </div>
                <div className="space-y-6 sticky top-28">
                    <AffirmationCard affirmation={randomAffirmation} />
                    <HelpCenterCard onContactClick={() => setIsSupportModalOpen(true)} />
                    <MatchImprovementCard />
                </div>
            </div>
            {activeMentorshipForScheduling && (<SchedulingModal mentor={activeMentorshipForScheduling.mentor} isOpen={isScheduling} onClose={() => setIsScheduling(false)} onSessionBook={handleSessionBooked} />)}
            {terminatingMentorship && (<TerminationRequestModal isOpen={!!terminatingMentorship} onClose={() => setTerminatingMentorship(null)} onSubmit={handleTerminationRequest} mentorship={terminatingMentorship} />)}
            {sessionForFeedback && (
                <SessionFeedbackModal 
                    isOpen={!!sessionForFeedback}
                    onClose={() => setSessionForFeedback(null)}
                    onSubmit={handleFeedbackSubmit}
                />
            )}
            <ContactSupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} onSubmit={handleSubmitSupportTicket} />
        </div>
    );
};

export default DashboardPage;