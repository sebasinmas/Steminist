import React, { useState, useCallback, useEffect } from 'react';
// FIX: Corrected import paths to ensure modules are found.
import { Page, UserRole, Theme, ConnectionStatus } from './types.js';
// FIX: Corrected import paths to ensure modules are found.
import type { Mentor, Session, ConnectionRequest, Mentee, Mentorship, MentorSurvey, Attachment } from './types.js';
// FIX: Corrected import paths to ensure modules are found.
import { mockMentors, mockCurrentUserMentee, mockConnectionRequests, mockCurrentMentor, mockMentorships, mockPendingSessions } from './data/mockData.js';
import Header from './components/layout/Header';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
// FIX: Corrected import paths to ensure modules are found.
import MentorSearchPage from './pages/MentorSearchPage.js';
import MentorProfilePage from './pages/MentorProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('landing');
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('mentee');
    const [currentUser, setCurrentUser] = useState<Mentee | Mentor>(mockCurrentUserMentee);
    const [theme, setTheme] = useState<Theme>('dark');
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
    const [mentorships, setMentorships] = useState<Mentorship[]>(mockMentorships);
    const [pendingSessions, setPendingSessions] = useState<Session[]>(mockPendingSessions);
    const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(mockConnectionRequests);
    const [mentors, setMentors] = useState<Mentor[]>(mockMentors);
    
    const [mentorConnections, setMentorConnections] = useState<Record<number, ConnectionStatus>>({});
    const [notificationCount, setNotificationCount] = useState<number>(0);
    
    useEffect(() => {
        const calculateNotifications = () => {
             const sessionNotifications = pendingSessions.filter(s => 
                (s.status === 'pending' && currentUserRole === 'mentor') || 
                (s.status === 'needs_confirmation' && currentUserRole === 'mentee')
            ).length;
            const connectionNotifications = connectionRequests.filter(cr => cr.status === 'pending' && currentUserRole === 'mentor').length;
            setNotificationCount(sessionNotifications + connectionNotifications);
        };
        calculateNotifications();
    }, [pendingSessions, connectionRequests, currentUserRole]);


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
    
    const navigateTo = useCallback((newPage: Page, data?: Mentor | Mentee) => {
        setPage(newPage);
        if (data) {
            if ('reviews' in data) {
                setSelectedMentor(data as Mentor);
                setSelectedMentee(null);
            } else {
                setSelectedMentee(data as Mentee);
                setSelectedMentor(null);
            }
        } else {
            setSelectedMentor(null);
            setSelectedMentee(null);
        }
        window.scrollTo(0, 0);
    }, []);

    const updateUserRole = (role: UserRole) => {
        setCurrentUserRole(role);
        if (role === 'mentee') {
            setCurrentUser(mockCurrentUserMentee);
            navigateTo('discover');
        } else if (role === 'mentor') {
            setCurrentUser(mockCurrentMentor);
            navigateTo('dashboard');
        } else if (role === 'admin') {
            navigateTo('admin_dashboard');
        }
    };
    
    const updateMentorshipSession = (mentorshipId: number, sessionId: number, updates: Partial<Session>) => {
        setMentorships(prev => prev.map(m => {
            if (m.id === mentorshipId) {
                return {
                    ...m,
                    sessions: m.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s)
                };
            }
            return m;
        }));
    };

    const addAttachmentToSession = (mentorshipId: number, sessionId: number, attachment: Attachment) => {
         setMentorships(prev => prev.map(m => {
            if (m.id === mentorshipId) {
                 return {
                    ...m,
                    sessions: m.sessions.map(s => {
                        if (s.id === sessionId) {
                            const newAttachments = [...(s.attachments || []), attachment];
                            return { ...s, attachments: newAttachments };
                        }
                        return s;
                    })
                };
            }
            return m;
         }));
    };

    const addSurveyToSession = (mentorshipId: number, sessionId: number, survey: MentorSurvey) => {
        updateMentorshipSession(mentorshipId, sessionId, { mentorSurvey: survey, status: 'completed' });
        // Check if this was the last session
        const mentorship = mentorships.find(m => m.id === mentorshipId);
        if (mentorship && mentorship.sessions.length === 3 && mentorship.sessions.every(s => s.status === 'completed' || s.id === sessionId)) {
            setMentorships(prev => prev.map(m => m.id === mentorshipId ? { ...m, status: 'completed' } : m));
        }
    };

    const updateConnectionStatus = (requestId: number, newStatus: 'accepted' | 'declined') => {
        const request = connectionRequests.find(r => r.id === requestId);
        if (!request) return;

        setConnectionRequests(prev => prev.map(r => r.id === requestId ? {...r, status: newStatus} : r));
        
        if (newStatus === 'accepted') {
            setMentorConnections(prev => ({...prev, [request.mentor.id]: 'connected'}));
            // Create a new mentorship
            const newMentorship: Mentorship = {
                id: mentorships.length + 1,
                mentor: request.mentor,
                mentee: request.mentee,
                status: 'active',
                sessions: [],
                startDate: new Date().toISOString().split('T')[0],
            };
            setMentorships(prev => [...prev, newMentorship]);
        } else {
            setMentorConnections(prev => ({...prev, [request.mentor.id]: 'declined'}));
        }
    };

    const sendConnectionRequest = (mentor: Mentor, motivationLetter: string) => {
        setMentorConnections(prev => ({...prev, [mentor.id]: 'pending'}));
        const newRequest: ConnectionRequest = {
            id: connectionRequests.length + 2,
            mentor,
            mentee: mockCurrentUserMentee,
            status: 'pending',
            motivationLetter,
        };
        setConnectionRequests(prev => [newRequest, ...prev]);
        console.log(`Connection request sent to ${mentor.name}`);
    };
    
    const addSession = (mentorshipId: number, newSession: Omit<Session, 'id' | 'sessionNumber'>) => {
        setMentorships(prev => prev.map(m => {
            if (m.id === mentorshipId && m.sessions.length < 3) {
                const newSessionWithId: Session = {
                    ...newSession,
                    id: Date.now(), // simple unique id
                    sessionNumber: m.sessions.length + 1
                };
                return { ...m, sessions: [...m.sessions, newSessionWithId] };
            }
            return m;
        }));
    };
    
    const updateMentorMaxMentees = (mentorId: number, maxMentees: number) => {
        setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, maxMentees } : m));
    }

    const requestMentorshipTermination = (mentorshipId: number, reasons: string[], details: string) => {
        let reasonText = `Razón(es): ${reasons.join(', ')}.`;
        if (details) {
            reasonText += `\nDetalles adicionales: ${details}`;
        }
        
        setMentorships(prev => prev.map(m => 
            m.id === mentorshipId 
            ? { ...m, status: 'termination_requested', terminationReason: reasonText } 
            : m
        ));
    };

    const renderPage = () => {
        const allSessions = mentorships.flatMap(m => m.sessions);
        switch (page) {
            case 'landing':
                return <LandingPage onRoleSelect={updateUserRole} navigateTo={navigateTo} />;
            case 'discover':
                return <MentorSearchPage 
                    mentors={mentors} 
                    navigateTo={navigateTo}
                    currentUser={currentUser as Mentee} 
                />;
            case 'profile':
                if (selectedMentor) {
                    const connectionStatus = mentorConnections[selectedMentor.id] || 'none';
                    return <MentorProfilePage 
                        mentor={selectedMentor} 
                        navigateTo={navigateTo} 
                        connectionStatus={connectionStatus}
                        onSendConnectionRequest={sendConnectionRequest} 
                    />;
                }
                return <MentorSearchPage 
                    mentors={mentors} 
                    navigateTo={navigateTo} 
                    currentUser={currentUser as Mentee}
                />;
            case 'profile_self':
                return <ProfilePage user={currentUser} />;
            case 'mentee_profile':
                if (selectedMentee) {
                    return <ProfilePage user={selectedMentee} isPublicView={true} />;
                }
                return <DashboardPage 
                    userRole={currentUserRole}
                    currentUser={currentUser}
                    mentorships={mentorships}
                    navigateTo={navigateTo}
                    addSession={addSession}
                    updateMentorshipSession={updateMentorshipSession}
                    addAttachmentToSession={addAttachmentToSession}
                    addSurveyToSession={addSurveyToSession}
                    requestMentorshipTermination={requestMentorshipTermination}
                />;
            case 'dashboard':
                return <DashboardPage 
                    userRole={currentUserRole}
                    currentUser={currentUser}
                    mentorships={mentorships}
                    navigateTo={navigateTo}
                    addSession={addSession}
                    updateMentorshipSession={updateMentorshipSession}
                    addAttachmentToSession={addAttachmentToSession}
                    addSurveyToSession={addSurveyToSession}
                    requestMentorshipTermination={requestMentorshipTermination}
                />;
            case 'notifications':
                 return <NotificationsPage 
                    userRole={currentUserRole} 
                    sessions={pendingSessions} 
                    connectionRequests={connectionRequests}
                    updateSessionStatus={() => {}} // This needs to be adapted if pending sessions are to be managed
                    updateConnectionStatus={updateConnectionStatus}
                 />;
            case 'admin_dashboard':
                 return <AdminDashboardPage
                    mentorships={mentorships}
                    requests={connectionRequests}
                    mentors={mentors}
                    updateConnectionStatus={updateConnectionStatus}
                    updateMentorMaxMentees={updateMentorMaxMentees}
                 />;
            default:
                return <LandingPage onRoleSelect={updateUserRole} navigateTo={navigateTo} />;
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
            <ToastProvider>
                <Header
                    currentPage={page}
                    navigateTo={navigateTo}
                    userRole={currentUserRole}
                    setUserRole={updateUserRole}
                    notificationCount={notificationCount}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
                <main className="pt-20">
                    {renderPage()}
                </main>
            </ToastProvider>
        </div>
    );
};

export default App;