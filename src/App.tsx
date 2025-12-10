
import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// FIX: Removed incorrect '.js' extensions from imports to allow module resolution to find the .ts/.tsx files.
import type { Page, UserRole, Theme, ConnectionStatus } from './types';
import type { Mentor, Session, ConnectionRequest, Mentee, Mentorship, MentorSurvey, Attachment, SupportTicket } from './types';
import { mockMentors, mockCurrentUserMentee, mockConnectionRequests, mockCurrentMentor, mockMentorships, mockPendingSessions } from './data/mockData';

import { AuthProvider, useAuth } from './context/AuthContext';
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
import { fetchMentors } from './services/mentorService';
import { createSupportTicket, updateSupportTicketStatus as updateSupportTicketStatusService, fetchSupportTickets } from './services/supportService';

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

    // Hook para capturar automáticamente el token de Google
    useGoogleTokenCapture();

    // The entire application state (mock data) is managed here
    // In a real app, this would be handled by a more robust state management library or hooks like React Query
    const [theme, setTheme] = useState<Theme>('dark');
    const [mentorships, setMentorships] = useState<Mentorship[]>(mockMentorships);
    const [pendingSessions, setPendingSessions] = useState<Session[]>(mockPendingSessions);
    const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(mockConnectionRequests);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [mentorConnections, setMentorConnections] = useState<Record<number, ConnectionStatus>>({});
    const [notificationCount, setNotificationCount] = useState<number>(0);

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

        loadMentors();
        loadSupportTickets();
    }, [isLoggedIn, role]);

    useEffect(() => {
        const calculateNotifications = () => {
            if (!isLoggedIn) return;
            const sessionNotifications = pendingSessions.filter(s =>
                (s.status === 'pending' && role === 'mentor') ||
                (s.status === 'needs_confirmation' && role === 'mentee')
            ).length;
            const connectionNotifications = connectionRequests.filter(cr => cr.status === 'pending' && role === 'mentor').length;
            const supportTicketNotifications = role === 'admin' ? supportTickets.filter(t => t.status === 'open').length : 0;
            setNotificationCount(sessionNotifications + connectionNotifications + supportTicketNotifications);
        };
        calculateNotifications();
    }, [pendingSessions, connectionRequests, role, supportTickets, isLoggedIn]);

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

    const addSurveyToSession = (mentorshipId: number, sessionId: number, survey: MentorSurvey) => {
        updateMentorshipSession(mentorshipId, sessionId, { mentorSurvey: survey, status: 'completed' });
        const mentorship = mentorships.find(m => m.id === mentorshipId);
        if (mentorship && mentorship.sessions.length === 3 && mentorship.sessions.every(s => s.status === 'completed' || s.id === sessionId)) {
            setMentorships(prev => prev.map(m => m.id === mentorshipId ? { ...m, status: 'completed' } : m));
        }
    };

    const updateConnectionStatus = (requestId: number, newStatus: 'accepted' | 'declined') => {
        const request = connectionRequests.find(r => r.id === requestId);
        if (!request) return;
        setConnectionRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
        if (newStatus === 'accepted') {
            setMentorConnections(prev => ({ ...prev, [request.mentor.id]: 'connected' }));
            const newMentorship: Mentorship = { id: mentorships.length + 1, mentor: request.mentor, mentee: request.mentee, status: 'active', sessions: [], startDate: new Date().toISOString().split('T')[0] };
            setMentorships(prev => [...prev, newMentorship]);
        } else {
            setMentorConnections(prev => ({ ...prev, [request.mentor.id]: 'declined' }));
        }
    };

    const sendConnectionRequest = (mentor: Mentor, motivationLetter: string) => {
        setMentorConnections(prev => ({ ...prev, [mentor.id]: 'pending' }));
        const newRequest: ConnectionRequest = { id: connectionRequests.length + 2, mentor, mentee: mockCurrentUserMentee, status: 'pending', motivationLetter };
        setConnectionRequests(prev => [newRequest, ...prev]);
    };

    const addSession = (mentorshipId: number, newSession: Omit<Session, 'id' | 'sessionNumber'>) => {
        setMentorships(prev => prev.map(m => {
            if (m.id === mentorshipId && m.sessions.length < 3) {
                const newSessionWithId: Session = { ...newSession, id: Date.now(), sessionNumber: m.sessions.length + 1 };
                return { ...m, sessions: [...m.sessions, newSessionWithId] };
            }
            return m;
        }));
    };

    const updateMentorMaxMentees = (mentorId: number, maxMentees: number) => {
        setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, maxMentees } : m));
    };

    const requestMentorshipTermination = (mentorshipId: number, reasons: string[], details: string) => {
        let reasonText = `Razón(es): ${reasons.join(', ')}.` + (details ? `\nDetalles adicionales: ${details}` : '');
        setMentorships(prev => prev.map(m => m.id === mentorshipId ? { ...m, status: 'termination_requested', terminationReason: reasonText } : m));
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
        // Handle both numeric and string IDs
        const mentor = mentors.find(m => {
            if (typeof m.id === 'number') {
                return m.id === parseInt(mentorId || '');
            }
            return String(m.id) === mentorId;
        });
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
                                updateSessionStatus={() => { }}
                                updateConnectionStatus={updateConnectionStatus}
                            />
                        } />
                        <Route path="/admin" element={
                            role === 'admin'
                                ? <AdminDashboardPage
                                    mentorships={mentorships}
                                    requests={connectionRequests}
                                    mentors={mentors}
                                    updateConnectionStatus={updateConnectionStatus}
                                    updateMentorMaxMentees={updateMentorMaxMentees}
                                    supportTickets={supportTickets}
                                    updateSupportTicketStatus={updateSupportTicketStatus}
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