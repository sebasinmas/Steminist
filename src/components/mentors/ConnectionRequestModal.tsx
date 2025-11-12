import React, { useState } from 'react';
import type { Mentor } from '../../types';
import Button from '../common/Button';
import { MENTORSHIP_GOALS } from '../../constants';

interface ConnectionRequestModalProps {
    mentor: Mentor;
    isOpen: boolean;
    onClose: () => void;
    onSendRequest: (motivationLetter: string) => void;
}

const ConnectionRequestModal: React.FC<ConnectionRequestModalProps> = ({ mentor, isOpen, onClose, onSendRequest }) => {
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [additionalMessage, setAdditionalMessage] = useState('');

    if (!isOpen) return null;

    const handleTopicToggle = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const handleGoalToggle = (goal: string) => {
        setSelectedGoals(prev =>
            prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
        );
    };

    const handleSubmit = () => {
        const motivationLetter = `**Temas de Interés:**\n- ${selectedTopics.join('\n- ')}\n\n**Objetivos:**\n- ${selectedGoals.join('\n- ')}\n\n**Mensaje Adicional:**\n${additionalMessage || 'N/A'}`;
        
        onSendRequest(motivationLetter);
        
        // Reset state
        setSelectedTopics([]);
        setSelectedGoals([]);
        setAdditionalMessage('');
    };
    
    const handleClose = () => {
        // Reset state on close
        setSelectedTopics([]);
        setSelectedGoals([]);
        setAdditionalMessage('');
        onClose();
    };

    const isSubmitDisabled = selectedTopics.length === 0 || selectedGoals.length === 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-6 md:p-8 max-w-2xl w-full relative transform transition-all flex flex-col max-h-[90vh]">
                <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-2">Enviar Solicitud de Conexión</h2>
                <p className="text-muted-foreground mb-6">a {mentor.name}</p>

                <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                    {/* Topics Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">1. Temas de Interés</h3>
                        <p className="text-sm text-muted-foreground mb-3">Selecciona los temas que más te interesan de la experiencia de {mentor.name}.</p>
                        <div className="flex flex-wrap gap-2">
                            {mentor.expertise.map(topic => (
                                <button 
                                    key={topic} 
                                    onClick={() => handleTopicToggle(topic)}
                                    className={`text-sm font-semibold px-3 py-1.5 rounded-full border-2 transition-colors ${selectedTopics.includes(topic) ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent border-border hover:bg-accent'}`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Goals Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">2. Tus Objetivos</h3>
                        <p className="text-sm text-muted-foreground mb-3">Elige tus principales objetivos para esta mentoría.</p>
                        <div className="space-y-2">
                            {MENTORSHIP_GOALS.map(goal => (
                                <label key={goal} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={selectedGoals.includes(goal)}
                                        onChange={() => handleGoalToggle(goal)}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-foreground">{goal}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Additional Message Section */}
                    <div>
                        <label htmlFor="motivation" className="block text-lg font-semibold mb-2">
                           3. Mensaje Adicional (Opcional)
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Añade cualquier otro contexto que quieras que {mentor.name} conozca.
                        </p>
                        <textarea
                            id="motivation"
                            rows={4}
                            value={additionalMessage}
                            onChange={(e) => setAdditionalMessage(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            placeholder="Ej: Estoy trabajando en un proyecto específico sobre..."
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t border-border">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                    >
                        Enviar Solicitud
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionRequestModal;