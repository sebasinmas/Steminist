import React, { useState } from 'react';
// FIX: The `Session` type now correctly omits 'sessionNumber' as it's generated in App.tsx.
import type { Mentor, Session } from '../../types';
import { mockMentee } from '../../data/mockData';
import Button from '../common/Button';
import { POSITIVE_AFFIRMATIONS } from '../../constants';

interface SchedulingModalProps {
    mentor: Mentor;
    isOpen: boolean;
    onClose: () => void;
    // FIX: Updated the type to Omit 'sessionNumber' as well, because it's calculated later in App.tsx.
    onSessionBook: (session: Omit<Session, 'id' | 'sessionNumber'>) => void;
}

const SchedulingModal: React.FC<SchedulingModalProps> = ({ mentor, isOpen, onClose, onSessionBook }) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [topic, setTopic] = useState('');
    const [goals, setGoals] = useState('');
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    const handleBooking = () => {
        if (!selectedDate || !selectedTime || !topic || !goals) return;
        
        // FIX: Removed 'mentor' and 'mentee' properties as they do not exist on the Session type and are already part of the parent Mentorship object.
        const newSession: Omit<Session, 'id' | 'sessionNumber'> = {
            date: selectedDate,
            time: selectedTime,
            duration: 60, // default duration
            status: 'pending',
            topic,
            menteeGoals: goals,
        };
        onSessionBook(newSession);
        onClose();
        // Reset state for next time
        setStep(1);
        setSelectedDate(null);
        setSelectedTime(null);
        setTopic('');
        setGoals('');
    };
    
    const randomAffirmation = POSITIVE_AFFIRMATIONS[Math.floor(Math.random() * POSITIVE_AFFIRMATIONS.length)];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-8 m-4 max-w-2xl w-full relative transform transition-all">
                 <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">&times;</button>
                 <h2 className="text-2xl font-bold mb-6 text-center">Reservar una sesión con {mentor.name}</h2>
                
                {step === 1 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">1. Selecciona Fecha y Hora</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {Object.entries(mentor.availability).map(([date, times]) => (
                                <div key={date}>
                                    <h4 className="font-semibold mb-2">{new Date(date).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                                    <div className="flex flex-col space-y-2">
                                        {/* FIX: Cast `times` to `string[]` to resolve TypeScript inference issue where it was typed as `unknown`. */}
                                        {(times as string[]).map(time => (
                                            <Button
                                                key={time}
                                                variant={selectedDate === date && selectedTime === time ? 'primary' : 'secondary'}
                                                onClick={() => { setSelectedDate(date); setSelectedTime(time); }}
                                            >
                                                {time}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setStep(2)} disabled={!selectedDate || !selectedTime}>Siguiente</Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">2. ¿Qué te gustaría discutir?</h3>
                        <div className="mb-4">
                            <label htmlFor="topic" className="block text-sm font-medium mb-2">Tema</label>
                            <input
                                type="text"
                                id="topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                placeholder="Ej: Consejo profesional, revisión de CV"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="goals" className="block text-sm font-medium mb-2">Tus objetivos para esta sesión</label>
                            <textarea
                                id="goals"
                                rows={4}
                                value={goals}
                                onChange={(e) => setGoals(e.target.value)}
                                className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                placeholder="Ej: Quiero recibir feedback sobre mi portafolio y hablar sobre la transición a diseño UX."
                            />
                        </div>
                         <div className="bg-accent text-accent-foreground p-4 rounded-md text-sm mb-6">
                           <p className="font-semibold">¡Consejo Rápido!</p>
                           <p>{randomAffirmation}</p>
                        </div>
                        <div className="flex justify-between">
                            <Button variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
                            <Button onClick={handleBooking} disabled={!topic || !goals}>Confirmar Reserva</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchedulingModal;