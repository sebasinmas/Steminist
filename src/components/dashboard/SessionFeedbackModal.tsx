import React, { useState } from 'react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface SessionFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    isLoading?: boolean;
}

const SessionFeedbackModal: React.FC<SessionFeedbackModalProps> = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const {addToast} = useToast();
    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return; // Prevent submission without rating
        await onSubmit(rating, comment);
        // Reset state
        setRating(0);
        setComment('');
        addToast('Feedback enviado. ¡Gracias por tu opinión!', 'success');
        onClose();
    };

    const handleSkip = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-card rounded-xl shadow-lg max-w-md w-full p-6 relative">
                <h2 className="text-xl font-bold mb-2">Feedback de la Sesión</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                    ¿Cómo fue tu última sesión? Tu feedback nos ayuda a mejorar.
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">Calificación General</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-colors"
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill={star <= (hoveredRating || rating) ? "#fbbf24" : "none"}
                                    stroke={star <= (hoveredRating || rating) ? "#fbbf24" : "currentColor"}
                                    strokeWidth="2"
                                    className="w-8 h-8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.044.885.77.463 1.13l-4.244 3.883a.562.562 0 00-.158.484l1.293 5.37c.174.723-.62 1.353-1.154.996l-4.686-2.92a.562.562 0 00-.59 0l-4.686 2.92c-.534.357-1.328-.273-1.154-.996l1.293-5.37a.562.562 0 00-.159-.484L2.073 10.088c-.422-.36-.1-.1086.463-1.13l5.518-.442a.562.562 0 00.475-.345L11.48 3.5z"
                                    />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">
                        Feedback Adicional <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <textarea
                        className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                        placeholder="¿Qué salió bien? ¿Qué podría mejorar?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                        Omitir
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={rating === 0 || isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SessionFeedbackModal;
