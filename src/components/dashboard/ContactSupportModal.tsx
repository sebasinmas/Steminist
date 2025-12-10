import React, { useState } from 'react';
import Button from '../common/Button';
import { XIcon } from '../common/Icons';

interface ContactSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (subject: string, message: string) => Promise<void>;
}

const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (subject && message && !isSubmitting) {
            setIsSubmitting(true);
            try {
                await onSubmit(subject, message);
                handleClose();
            } catch (error) {
                // Error is handled by the parent component
                setIsSubmitting(false);
            }
        }
    };
    
    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing while submitting
        setSubject('');
        setMessage('');
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-8 m-4 max-w-lg w-full relative transform transition-all">
                <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-2">Contactar a Soporte</h2>
                <p className="text-muted-foreground mb-6">Envía tu consulta y un administrador te responderá pronto.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-1">Asunto</label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            placeholder="Ej: Problema técnico con la agenda"
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium mb-1">Mensaje</label>
                        <textarea
                            id="message"
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            placeholder="Describe tu problema o pregunta en detalle..."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={!subject || !message || isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Enviar Consulta'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ContactSupportModal;
