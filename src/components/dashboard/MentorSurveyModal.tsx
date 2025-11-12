import React, { useState } from 'react';
import Button from '../common/Button';
import { MENTOR_SURVEY_QUESTIONS, SURVEY_OPTIONS } from '../../constants';
import type { MentorSurvey } from '../../types';

interface MentorSurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (surveyData: MentorSurvey) => void;
}

const MentorSurveyModal: React.FC<MentorSurveyModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [preparation, setPreparation] = useState<'excellent' | 'good' | 'average' | 'poor' | ''>('');
    const [engagement, setEngagement] = useState<'excellent' | 'good' | 'average' | 'poor' | ''>('');
    const [outcome, setOutcome] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!preparation || !engagement || !outcome) return;
        onSubmit({ preparation, engagement, outcome });
        handleClose();
    };
    
    const handleClose = () => {
        setPreparation('');
        setEngagement('');
        setOutcome('');
        onClose();
    };
    
    const RadioGroup = ({ label, value, onChange, options }: { label: string; value: string; onChange: (val: any) => void; options: Record<string,string> }) => (
        <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {Object.entries(options).map(([key, text]) => (
                     <button 
                        key={key} 
                        onClick={() => onChange(key)}
                        className={`text-sm font-semibold px-3 py-1.5 rounded-full border-2 transition-colors ${value === key ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent border-border hover:bg-accent'}`}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-8 m-4 max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-4">Feedback de la Sesión</h2>
                <p className="text-muted-foreground mb-6">Tus comentarios ayudan a mejorar la plataforma y a dar seguimiento al progreso.</p>

                <RadioGroup 
                    label={MENTOR_SURVEY_QUESTIONS.preparation}
                    value={preparation}
                    onChange={setPreparation}
                    options={SURVEY_OPTIONS}
                />
                
                 <RadioGroup 
                    label={MENTOR_SURVEY_QUESTIONS.engagement}
                    value={engagement}
                    onChange={setEngagement}
                    options={SURVEY_OPTIONS}
                />

                <div className="mb-6">
                    <label htmlFor="outcome" className="block text-sm font-medium mb-2">{MENTOR_SURVEY_QUESTIONS.outcome}</label>
                    <textarea
                        id="outcome"
                        rows={3}
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                        placeholder="Ej: Aclaramos dudas sobre su CV, definimos los próximos pasos para su proyecto..."
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={!preparation || !engagement || !outcome}>Enviar Feedback</Button>
                </div>
            </div>
        </div>
    );
};

export default MentorSurveyModal;
