import React, { useState, useMemo } from 'react';
import type { Mentor } from '../../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface MentorManagementProps {
    mentors: Mentor[];
    mentorMenteesCount: Record<number, number>;
    onUpdateMaxMentees: (mentorId: number, maxMentees: number) => void;
    onViewDetails: (mentor: Mentor) => void;
}

const MentorManagement: React.FC<MentorManagementProps> = ({ mentors, mentorMenteesCount, onUpdateMaxMentees, onViewDetails }) => {
    const [editableCapacity, setEditableCapacity] = useState<Record<number, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const handleCapacityChange = (mentorId: number, value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setEditableCapacity(prev => ({ ...prev, [mentorId]: numericValue }));
    };
    
    const handleSave = (mentorId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent modal from opening
        const value = editableCapacity[mentorId];
        if (value !== undefined && value !== '') {
            onUpdateMaxMentees(mentorId, parseInt(value, 10));
            addToast(`Capacidad de ${mentors.find(m => m.id === mentorId)?.name} actualizada.`, 'success');
        }
    }
    
    const filteredMentors = useMemo(() => {
        return mentors.filter(mentor => 
            mentor.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [mentors, searchTerm]);

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-foreground/80">Configurar Capacidad de Mentoras</h3>
             <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar mentora por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm p-2 border border-border rounded-lg bg-input"
                />
            </div>
            <Card className="p-0">
                <div className="max-h-[70vh] overflow-y-auto">
                    <ul className="divide-y divide-border">
                        {filteredMentors.map(mentor => {
                            const currentMentees = mentorMenteesCount[mentor.id] || 0;
                            const isAtCapacity = currentMentees >= mentor.maxMentees;
                            
                            return (
                                <li 
                                    key={mentor.id} 
                                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-accent/50 transition-colors"
                                >
                                    <div 
                                        className="flex items-center space-x-4 mb-4 sm:mb-0 grow cursor-pointer"
                                        onClick={() => onViewDetails(mentor)}
                                    >
                                        <img src={mentor.avatarUrl} alt={mentor.name} className="w-12 h-12 rounded-full" />
                                        <div>
                                            <p className="font-bold">{mentor.name}</p>
                                            <p className="text-sm text-muted-foreground">{mentor.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                                        <div className="flex-1 text-center">
                                            <p className={`font-bold text-lg ${isAtCapacity ? 'text-red-500' : 'text-foreground'}`}>
                                                {currentMentees} / {mentor.maxMentees}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Mentoreadas Activas</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <input
                                                type="text"
                                                pattern="[0-9]*"
                                                value={editableCapacity[mentor.id] ?? mentor.maxMentees}
                                                onChange={(e) => handleCapacityChange(mentor.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()} // Prevent modal from opening
                                                className="w-16 p-2 border border-border rounded-md bg-input text-center"
                                                aria-label={`Capacidad máxima para ${mentor.name}`}
                                            />
                                            <Button size="sm" onClick={(e) => handleSave(mentor.id, e)}>Guardar</Button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default MentorManagement;