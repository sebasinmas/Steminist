import React, { useState } from 'react';
import type { Mentorship } from '../../types';
import Button from '../common/Button';

interface TerminationRequestModalProps {
    mentorship: Mentorship;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reasons: string[], details: string) => void;
}

const TERMINATION_REASONS = [
    'Objetivos cumplidos',
    'Falta de disponibilidad',
    'Desajuste de expectativas',
    'Cambio de objetivos profesionales',
    'Otro'
];

const TerminationRequestModal: React.FC<TerminationRequestModalProps> = ({ mentorship, isOpen, onClose, onSubmit }) => {
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [details, setDetails] = useState('');

    if (!isOpen) return null;
    
    const handleReasonClick = (reason: string) => {
        setSelectedReasons(prev => 
            prev.includes(reason) 
            ? prev.filter(r => r !== reason)
            : [...prev, reason]
        );
    };

    const handleSubmit = () => {
        if (selectedReasons.length > 0) {
            onSubmit(selectedReasons, details);
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedReasons([]);
        setDetails('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-8 m-4 max-w-xl w-full relative transform transition-all flex flex-col">
                <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl" aria-label="Close modal">&times;</button>
                <h2 className="text-2xl font-bold mb-1">Solicitar Terminación de Mentoría</h2>
                <p className="text-muted-foreground mb-6">con {mentorship.mentee.name}</p>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">1. Razón de la Terminación</h3>
                        <p className="text-sm text-muted-foreground mb-3">Selecciona una o más razones. Esto será enviado a un administrador para su revisión.</p>
                        <div className="flex flex-wrap gap-2">
                           {TERMINATION_REASONS.map(reason => (
                                <button
                                    key={reason}
                                    onClick={() => handleReasonClick(reason)}
                                    className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${selectedReasons.includes(reason) ? 'bg-secondary border-secondary-foreground text-secondary-foreground' : 'bg-transparent border-border hover:bg-accent'}`}
                                    aria-pressed={selectedReasons.includes(reason)}
                                >
                                    {reason}
                                </button>
                           ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="details" className="block text-lg font-semibold mb-2">
                           2. Detalles Adicionales (Opcional)
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Añade cualquier otro contexto que consideres importante.
                        </p>
                        <textarea
                            id="details"
                            rows={4}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            placeholder="Proporciona más detalles aquí..."
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-8 pt-6 border-t border-border space-x-3">
                    <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={selectedReasons.length === 0}
                    >
                        Enviar Solicitud
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TerminationRequestModal;
