import React, { useState, useEffect } from 'react'; // Agregamos useEffect
import type { Mentor, Session } from '../../types';
import Button from '../common/Button';
import { POSITIVE_AFFIRMATIONS } from '../../utils/constants';
// IMPORTAR EL SERVICIO
import { getMentorAvailability } from '../../services/mentorService';

interface SchedulingModalProps {
    mentor: Mentor;
    isOpen: boolean;
    onClose: () => void;
    onSessionBook: (session: Omit<Session, 'id' | 'sessionNumber'>) => void;
}

const SchedulingModal: React.FC<SchedulingModalProps> = ({ mentor, isOpen, onClose, onSessionBook }) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [topic, setTopic] = useState('');
    const [goals, setGoals] = useState('');
    const [step, setStep] = useState(1);
    
    // NUEVOS ESTADOS para manejar la carga de datos
    const [realAvailability, setRealAvailability] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const parseLocalDate = (dateString: string) => {
        // dateString viene como "YYYY-MM-DD"
        const [year, month, day] = dateString.split('-').map(Number);
        // Creamos la fecha usando el constructor local (año, mes-1, dia)
        // Esto garantiza que sea las 00:00 hora local, no UTC
        return new Date(year, month - 1, day);
    };

    // EFECTO: Cargar disponibilidad real al abrir el modal
    useEffect(() => {
        const loadAvailability = async () => {
            if (isOpen && mentor.id) {
                setIsLoading(true);
                setRealAvailability({}); // Limpiar estado anterior
                try {
                    const data = await getMentorAvailability(mentor.id);
                    setRealAvailability(data);
                } catch (error) {
                    console.error("Error cargando disponibilidad:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadAvailability();
    }, [isOpen, mentor.id]);

    if (!isOpen) return null;

    const handleBooking = () => {
        if (!selectedDate || !selectedTime || !topic || !goals) return;

        // Construir el objeto de sesión para enviar al padre
        // Importante: concatenar fecha y hora para tener un timestamp completo si es necesario
        const newSession: Omit<Session, 'id' | 'sessionNumber'> = {
            date: selectedDate, // "YYYY-MM-DD"
            time: selectedTime, // "HH:MM"
            duration: 60,
            status: 'pending',
            topic,
            menteeGoals: goals,
        };
        onSessionBook(newSession);
        onClose();
        
        // Resetear formulario
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
                        
                        {/* ESTADO DE CARGA */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                <p className="text-muted-foreground">Buscando horarios disponibles...</p>
                            </div>
                        ) : Object.keys(realAvailability).length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-border rounded-lg">
                                <p className="text-muted-foreground">Esta mentora no tiene horarios disponibles en los próximos 30 días.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Renderizamos los horarios reales obtenidos de la BD */}
                                {Object.entries(realAvailability)
                                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                                    .map(([date, times]) => (
                                    <div key={date} className={`p-3 rounded-lg border transition-colors ${selectedDate === date ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                                        <h4 className="font-semibold mb-2 text-center text-sm">
                                            {parseLocalDate(date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {times.map(time => (
                                                <Button
                                                    key={`${date}-${time}`}
                                                    size="sm"
                                                    className={`text-xs px-2 py-1 h-auto ${selectedDate === date && selectedTime === time 
                                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                                                    onClick={() => { setSelectedDate(date); setSelectedTime(time); }}
                                                >
                                                    {time}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

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
                                placeholder="Ej: Quiero recibir feedback sobre mi portafolio..."
                            />
                        </div>
                        <div className="bg-accent text-accent-foreground p-4 rounded-md text-sm mb-6 flex items-start gap-3">
                            <span className="text-xl">✨</span>
                            <div>
                                <p className="font-semibold">¡Consejo Rápido!</p>
                                <p>{randomAffirmation}</p>
                            </div>
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