import React, { useState } from 'react';
import Button from '../common/Button';

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, feedback: string) => void;
}

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(rating, feedback);
        onClose();
        // Reset state
        setRating(0);
        setFeedback('');
    };
    
    const handleClose = () => {
        onClose();
        // Reset state
        setRating(0);
        setFeedback('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-card rounded-lg p-8 m-4 max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-4">Feedback de la Sesión</h2>
                <p className="text-muted-foreground mb-6">¿Cómo fue tu última sesión? Tu feedback nos ayuda a mejorar.</p>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Calificación General</label>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setRating(star)} className="text-3xl text-yellow-400 focus:outline-none">
                                {star <= rating ? '★' : '☆'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="feedback" className="block text-sm font-medium mb-2">Feedback Adicional (opcional)</label>
                    <textarea
                        id="feedback"
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                        placeholder="¿Qué salió bien? ¿Qué podría mejorar?"
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <Button variant="ghost" onClick={handleClose}>Omitir</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={rating === 0}>Enviar</Button>
                </div>
            </div>
        </div>
    );
};

export default SurveyModal;