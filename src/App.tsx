
import { supabase } from './lib/supabase';
import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import type { Page, UserRole, Theme, ConnectionStatus } from './types';
import type { Mentor, Session, ConnectionRequest, Mentee, Mentorship, MentorSurvey, Attachment, SupportTicket } from './types';
import { mockMentors, mockCurrentUserMentee, mockConnectionRequests, mockCurrentMentor, mockMentorships, mockPendingSessions } from './data/mockData';
import { connectionService } from './services/connectionService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { ToastProvider } from './context/ToastContext';
import { useGoogleTokenCapture } from './hooks/useGoogleTokenCapture';
import ProtectedRoute from './routes/ProtectedRoute';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import MentorSearchPage from './pages/MentorSearchPage';
import MentorProfilePage from './pages/MentorProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FileLibraryPage from './pages/FileLibraryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { fetchMentors, updateMentorMaxMentees as updateMentorService } from './services/mentorService';
import { createSupportTicket, updateSupportTicketStatus as updateSupportTicketStatusService, fetchSupportTickets } from './services/supportService';
import { mentorService } from './services/mentorService';
import { getConnectionRequestsForMentor, getPendingSessionsForUser } from './services/notificationService';
import { fetchMentorships, fetchMentees, updateSessionStatus as updateSessionService, completeSessionWithSurvey } from './services/mentorshipService';
import { mentorshipAdminService } from './services/mentorshipAdminService';

const App: React.FC = () => {
    return (
        <BrowserRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <AuthProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

const AppContent: React.FC = () => {
    const { isLoggedIn, role, user } = useAuth();
    const { addToast } = useToast();


    // Hook para capturar automáticamente el token de Google
    useGoogleTokenCapture();

    // The entire application state (mock data) is managed here
    // In a real app, this would be handled by a more robust state management library or hooks like React Query
    const [theme, setTheme] = useState<Theme>('dark');
    const [pendingSessions, setPendingSessions] = useState<Session[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [mentees, setMentees] = useState<Mentee[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [mentorConnections, setMentorConnections] = useState<Record<string | number, ConnectionStatus>>({});
    const [notificationCount, setNotificationCount] = useState<number>(0);
    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);

    useEffect(() => {
        const loadMentors = async () => {
            if (isLoggedIn) {
                try {
                    const data = await fetchMentors();
                    setMentors(data);
                } catch (error) {
                    console.error("Failed to fetch mentors:", error);
                }
            }
        };

        const loadSupportTickets = async () => {
            if (isLoggedIn && role === 'admin') {
                try {
                    const tickets = await fetchSupportTickets();
                    setSupportTickets(tickets);
                } catch (error) {
                    console.error("Failed to fetch support tickets:", error);
                }
            }
        };

        const loadMentorships = async () => {
            if (isLoggedIn) {
                try {
                    const data = await fetchMentorships();
                    setMentorships(data);
                } catch (error) {
                    console.error("Failed to fetch mentorships:", error);
                }
            }
        };

        const loadConnectionRequests = async () => {
            if (isLoggedIn && user && role === 'mentor') {
                try {
                    setConnectionRequests([]);
                    const requests = await getConnectionRequestsForMentor(String(user.id));
                    setConnectionRequests(requests);
                } catch (error) {
                    console.error("Failed to fetch connection requests:", error);
                }
            }
        };

        const loadPendingSessions = async () => {
            if (isLoggedIn && user) {
                try {
                    setPendingSessions([]);
                    const sessions = await getPendingSessionsForUser(String(user.id));
                    setPendingSessions(sessions);
                } catch (error) {
                    console.error("Failed to fetch pending sessions:", error);
                    console.warn("Using mock pending sessions due to error.");
                    setPendingSessions(mockPendingSessions);
                }
            }
        }

        loadConnectionRequests();
        loadPendingSessions();
        loadMentors();
        loadSupportTickets();
        loadMentorships();
    }, [isLoggedIn, role]);

    useEffect(() => {
        const calculateNotifications = () => {
            if (!isLoggedIn) return;
            const sessionNotifications = pendingSessions.filter(s =>
                (s.status === 'pending' && role === 'mentor') ||
                (s.status === 'needs_confirmation' && role === 'mentee')
            ).length;
            const connectionNotifications = connectionRequests.filter(cr => cr.status === 'pending_mentor' && role === 'mentor').length;
            const supportTicketNotifications = role === 'admin' ? supportTickets.filter(t => t.status === 'open').length : 0;
            setNotificationCount(sessionNotifications + connectionNotifications + supportTicketNotifications);
        };
        calculateNotifications();
    }, [pendingSessions, connectionRequests, role, supportTickets, isLoggedIn, setPendingSessions]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        if (initialTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            if (isLoggedIn) {
                try {
                    // Cargar Mentorías (necesario para calcular capacidad de mentoras en admin)
                    const realMentorships = await mentorService.fetchMentorships();
                    setMentorships(realMentorships);

                    // Cargar Solicitudes (solo si es admin, o podrías filtrar en backend por rol)
                    if (role === 'admin') {
                        const realRequests = await connectionService.fetchPendingRequests();
                        setConnectionRequests(realRequests);
                        const realMentees = await fetchMentees();
                        setMentees(realMentees);
                    }

                    // Cargar Mentoras (ya existente)
                    const mentorsData = await fetchMentors();
                    setMentors(mentorsData);

                } catch (error) {
                    console.error("Error loading dashboard data:", error);
                    addToast("Error cargando datos del sistema", 'error');
                }
            }
        };
        loadData();
    }, [isLoggedIn, role]); // Se ejecuta al loguearse o cambiar rol

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Data manipulation functions (acting as a mock API)
    const updateMentorshipSession = (mentorshipId: number, sessionId: number, updates: Partial<Session>) => {
        setMentorships(prev => prev.map(m => m.id === mentorshipId ? { ...m, sessions: m.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s) } : m));
    };

    const addAttachmentToSession = (mentorshipId: number, sessionId: number, attachment: Attachment) => {
        setMentorships(prev => prev.map(m => m.id === mentorshipId ? { ...m, sessions: m.sessions.map(s => s.id === sessionId ? { ...s, attachments: [...(s.attachments || []), attachment] } : s) } : m));
    };

    const addSurveyToSession = async (mentorshipId: number, sessionId: number, survey: MentorSurvey) => {
        if (!user) return;

        try {
            // 1. Llamada a Supabase
            const success = await completeSessionWithSurvey(sessionId, user.id, survey);

            if (!success) {
                addToast('Error al guardar la encuesta. Inténtalo de nuevo.', 'error');
                return;
            }

            setMentorships(prev => prev.map(m => {
                if (m.id === mentorshipId) {
                    const updatedSessions = m.sessions.map(s => 
                        s.id === sessionId 
                            ? { ...s, status: 'completed' as const, mentorSurvey: survey } 
                            : s
                    );
                    
                    // Lógica opcional: Si todas las sesiones (ej. 3) están completas, 
                    // podrías marcar la mentoría como completada aquí también si tu lógica lo requiere.
                    
                    return { ...m, sessions: updatedSessions };
                }
                return m;
            }));

        } catch (error) {
            console.error("Error in addSurveyToSession:", error);
            addToast('Ocurrió un error inesperado.', 'error');
        }
    };

    const updateConnectionStatus = async (requestId: number, newStatus: 'accepted' | 'rejected' | 'pending_mentor') => {
        try {
            // Llamada a la RPC (Función de Base de Datos)
            const { data, error } = await supabase.rpc('handle_connection_request', {
                request_id: requestId,
                new_status: newStatus
            });

            if (error) throw error;

            // Actualizar UI: Remover de solicitudes pendientes
            setConnectionRequests(prev => prev.filter(r => r.id !== requestId));

            if (newStatus === 'pending_mentor') {
                const request = connectionRequests.find(r => r.id === requestId);

                if (request && data.mentorship_id) {
                    // Construir objeto Mentorship para la UI
                    const newMentorship: Mentorship = {
                        id: data.mentorship_id,
                        mentor: request.mentor,
                        mentee: request.mentee,
                        status: 'active',
                        sessions: [],
                        startDate: new Date().toISOString()
                    };

                    setMentorships(prev => [...prev, newMentorship]);
                    addToast(`Solicitud aceptada y mentoría creada.`, 'success');
                }
            } else {
                addToast(`Solicitud rechazada.`, 'info');
            }
        } catch (error: any) {
            console.error("Error updating connection status:", error);
            addToast(`Error al procesar la solicitud: ${error.message}`, 'error');
        }
    };

    const sendConnectionRequest = async (
        mentor: Mentor,
        motivationLetter: string,
        interests: string[],
        motivations: string[],
    ) => {
        if (!user) return;

        setMentorConnections(prev => ({ ...prev, [String(mentor.id)]: 'pending' }));

        try {
            const newRequestData = await connectionService.createRequest(
                String(user.id),
                String(mentor.id),
                motivationLetter,
                interests,
                motivations,
            );
            console.log('Nueva request desde Supabase:', newRequestData);

            const newRequest: ConnectionRequest = {
                id: newRequestData.id,
                mentor: mentor,
                mentee: user as Mentee,
                status: 'pending',
                motivationLetter: newRequestData.motivation_letter,
                interests: newRequestData.interest || interests,
                motivations: newRequestData.motivation || motivations,
            };

            setConnectionRequests(prev => [newRequest, ...prev]);
            addToast('Solicitud enviada correctamente', 'success');
        } catch (error: any) {
            console.error('Error enviando solicitud:', error);
            addToast(`Error al enviar solicitud: ${error?.message ?? String(error)}`, 'error');
            // Revertir estado si falla
            setMentorConnections(prev => {
                const newState = { ...prev };
                delete newState[String(mentor.id)];
                return newState;
            });
        }
    };


   const addSession = async (mentorshipId: number, newSession: Omit<Session, 'id' | 'sessionNumber'>) => {
        try {

            const currentMentorship = mentorships.find(m => m.id === mentorshipId);
  
            const nextSessionNumber = (currentMentorship?.sessions.length || 0) + 1;

            const scheduledAt = `${newSession.date}T${newSession.time}:00`;

            const { data, error } = await supabase
                .from('sessions')
                .insert([{
                    mentorship_id: mentorshipId,
                    session_number: nextSessionNumber, 
                    scheduled_at: scheduledAt,
                    duration_minutes: newSession.duration,
                    topic: newSession.topic,
                    mentee_goals: newSession.menteeGoals,
                    status: 'pending'
                }])
                .select(`
                    *,
                    mentorship:mentorships (
                        mentor:users!mentor_id (id, first_name, last_name, avatar_url, email),
                        mentee:users!mentee_id (id, first_name, last_name, avatar_url, email)
                    )
                `)
                .single();

            if (error) throw error;


            const createdSession: Session = {
                id: data.id,
                sessionNumber: data.session_number, 
                date: newSession.date,
                time: newSession.time,
                duration: data.duration_minutes,
                status: 'pending',
                topic: data.topic,
                menteeGoals: data.mentee_goals,
                mentor: data.mentorship?.mentor,
                mentee: data.mentorship?.mentee
            };

            setMentorships(prev => prev.map(m => {
                if (m.id === mentorshipId) {
                    return { ...m, sessions: [...m.sessions, createdSession] };
                }
                return m;
            }));

            setPendingSessions(prev => [...prev, createdSession]);

            addToast('Solicitud de sesión enviada exitosamente.', 'success');

        } catch (error: any) {
            console.error("Error creating session:", error);
            addToast(`Error al agendar la sesión: ${error.message}`, 'error');
        }
    };

    const handleUpdateSessionStatus = async (sessionId: number, newStatus: Session['status']) => {
        try {
            // 1. Llamada a Supabase
            const success = await updateSessionService(sessionId, newStatus);

            if (!success) {
                addToast('No se pudo actualizar el estado de la sesión.', 'error');
                return;
            }

            // 2. Actualizar estado local de Notificaciones (pendingSessions)
            // Removemos la sesión de la lista de pendientes porque ya fue procesada
            setPendingSessions(prev => prev.filter(s => s.id !== sessionId));

            // 3. Actualizar estado local del Dashboard (mentorships)
            // Para que cuando la mentora vaya al dashboard, la sesión salga como 'confirmed' o 'cancelled'
            setMentorships(prev => prev.map(m => ({
                ...m,
                sessions: m.sessions.map(s =>
                    s.id === sessionId ? { ...s, status: newStatus } : s
                )
            })));

            // 4. Feedback al usuario
            if (newStatus === 'confirmed') {
                addToast('Sesión confirmada. Se ha notificado a la mentoreada.', 'success');
            } else if (newStatus === 'cancelled') {
                addToast('Solicitud de sesión rechazada.', 'info');
            }

        } catch (error) {
            console.error("Error updating session:", error);
            addToast('Ocurrió un error al procesar la solicitud.', 'error');
        }
    };

    const updateMentorMaxMentees = async (mentorId: string | number, maxMentees: number) => {
        // Optimistic update
        setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, maxMentees } : m));

        // Call service for persistence
        if (isLoggedIn) {
            const idString = String(mentorId);
            try {
                const success = await updateMentorService(idString, maxMentees);
                if (!success) {
                    console.error('Failed to update max mentees in DB');
                    // Optionally revert state here if needed
                }
            } catch (error) {
                console.error('Error calling update service:', error);
            }
        }
    };

    const requestMentorshipTermination = async (
        mentorshipId: number,
        reasons: string[],
        details: string
    ) => {
        try {
            // 1) Actualizar en Supabase
            const updated = await mentorshipAdminService.requestTermination(
                mentorshipId,
                reasons,
                details
            );

            // 2) Actualizar estado local para que Dashboard y Admin lo vean
            setMentorships(prev =>
                prev.map(m =>
                    m.id === mentorshipId
                        ? {
                            ...m,
                            status: updated.status as Mentorship['status'],
                            terminationReason:
                                // según cómo venga del backend
                                (updated as any).termination_reason ??
                                (updated as any).terminationReason ??
                                m.terminationReason,
                        }
                        : m
                )
            );

            addToast('Solicitud de terminación enviada para revisión.', 'info');
        } catch (error: any) {
            console.error('Error solicitando terminación de mentoría:', error);
            addToast(
                `No se pudo enviar la solicitud de terminación: ${error?.message ?? 'Error desconocido'}`,
                'error'
            );
            throw error; // opcional, por si quieres manejarlo en el Dashboard
        }
    };

    const updateMentorshipTerminationStatus = async (
        mentorshipId: number,
        action: 'confirm' | 'deny'
    ) => {
        try {
            // Elegimos qué servicio llamar
            const serviceFn =
                action === 'confirm'
                    ? mentorshipAdminService.confirmTermination
                    : mentorshipAdminService.denyTermination;

            const updated = await serviceFn(mentorshipId);

            // Actualizar estado local
            setMentorships(prev =>
                prev.map(m =>
                    m.id === mentorshipId
                        ? {
                            ...m,
                            status: updated.status as Mentorship['status'],
                            terminationReason:
                                (updated as any).termination_reason ??
                                (updated as any).terminationReason ??
                                m.terminationReason,
                        }
                        : m
                )
            );

            if (action === 'confirm') {
                addToast('Mentoría terminada correctamente.', 'success');
            } else {
                addToast('Solicitud de terminación denegada. La mentoría sigue activa.', 'info');
            }
        } catch (error: any) {
            console.error('Error actualizando estado de terminación:', error);
            addToast(
                `No se pudo actualizar la solicitud de terminación: ${error?.message ?? 'Error desconocido'}`,
                'error'
            );
        }
    };

    const submitSupportTicket = async (subject: string, message: string) => {
        if (!user) return;

        try {
            // Convert user id to string (should be UUID)
            const userId = String(user.id);

            // Save to database
            await createSupportTicket(userId, subject, message);

            // Also update local state for admin dashboard
            const newTicket: SupportTicket = {
                id: Date.now(),
                user: user as Mentor | Mentee,
                subject,
                message,
                status: 'open',
                timestamp: new Date().toISOString()
            };
            setSupportTickets(prev => [newTicket, ...prev]);
        } catch (error) {
            console.error('Error submitting support ticket:', error);
            throw error; // Re-throw to allow caller to handle error
        }
    };

    const updateSupportTicketStatus = async (ticketId: number, status: 'resolved') => {
        try {
            await updateSupportTicketStatusService(ticketId, status);
            setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
        } catch (error) {
            console.error('Failed to update ticket status:', error);
            // Optionally add toast error here
        }
    };

    // Wrapper for MentorProfilePage to handle data fetching based on URL param
    const MentorProfilePageWrapper = () => {
        const { mentorId } = useParams<{ mentorId: string }>();
        const mentor = mentors.find(m => String(m.id) === (mentorId || ''));
        if (!mentor) {
            return <Navigate to="/discover" replace />;
        }
        const connectionStatus = mentorConnections[mentor.id] || 'none';
        return <MentorProfilePage mentor={mentor} connectionStatus={connectionStatus} onSendConnectionRequest={sendConnectionRequest} />;
    };


    return (
        <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
            {isLoggedIn && (
                <Header
                    notificationCount={notificationCount}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
            )}
            <main className={isLoggedIn ? "pt-20" : ""}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register/:role" element={<RegisterPage />} />
                    <Route path="/register" element={<Navigate to="/register/mentee" replace />} />

                    <Route path="/" element={<HomePage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={
                            role === 'admin'
                                ? <Navigate to="/admin" replace />
                                : <DashboardPage
                                    mentorships={mentorships}
                                    addSession={addSession}
                                    updateMentorshipSession={updateMentorshipSession}
                                    addAttachmentToSession={addAttachmentToSession}
                                    addSurveyToSession={addSurveyToSession}
                                    requestMentorshipTermination={requestMentorshipTermination}
                                    submitSupportTicket={submitSupportTicket}
                                />
                        } />
                        <Route path="/discover" element={<MentorSearchPage mentors={mentors} />} />
                        <Route path="/mentor/:mentorId" element={<MentorProfilePageWrapper />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/library" element={<FileLibraryPage mentorships={mentorships} />} />
                        <Route path="/notifications" element={
                            <NotificationsPage
                                sessions={pendingSessions}
                                connectionRequests={connectionRequests}
                                updateSessionStatus={handleUpdateSessionStatus}
                                updateConnectionStatus={updateConnectionStatus}
                            />
                        } />
                        <Route path="/admin" element={
                            role === 'admin'
                                ? <AdminDashboardPage
                                    mentorships={mentorships}
                                    requests={connectionRequests}
                                    mentors={mentors}
                                    mentees={mentees}
                                    updateConnectionStatus={updateConnectionStatus}
                                    updateMentorMaxMentees={updateMentorMaxMentees}
                                    supportTickets={supportTickets}
                                    updateSupportTicketStatus={updateSupportTicketStatus}
                                    updateMentorshipTerminationStatus={updateMentorshipTerminationStatus}
                                />
                                : <Navigate to="/dashboard" replace />
                        } />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;