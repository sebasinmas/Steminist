import React, { useState, useMemo } from 'react';
import type { Mentee } from '../../types';
import Card from '../common/Card';
import { Avatar } from '../common/Avatar';

interface MenteeWithStats {
    mentee: Mentee;
    active: number;
    completed: number;
}

interface MenteeManagementProps {
    menteesWithStats: MenteeWithStats[];
    onViewDetails: (mentee: Mentee) => void;
}

const MenteeManagement: React.FC<MenteeManagementProps> = ({ menteesWithStats, onViewDetails }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMentees = useMemo(() => {
        return menteesWithStats.filter(({ mentee }) =>
            mentee.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [menteesWithStats, searchTerm]);

    return (
        <div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar mentoreada por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm p-2 border border-border rounded-lg bg-input"
                />
            </div>
            <Card className="p-0">
                <div className="max-h-[70vh] overflow-y-auto">
                    <ul className="divide-y divide-border">
                        {filteredMentees.map(({ mentee, active, completed }) => (
                            <li
                                key={mentee.id}
                                className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer"
                                onClick={() => onViewDetails(mentee)}
                            >
                                <div className="flex items-center space-x-4">
                                    <Avatar src={mentee.avatarUrl} alt={mentee.name} className="w-12 h-12" />
                                    <div>
                                        <p className="font-bold">{mentee.name}</p>
                                        <p className="text-sm text-muted-foreground">{mentee.title || 'Estudiante'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-8">
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{active}</p>
                                        <p className="text-sm text-muted-foreground">Activas</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{completed}</p>
                                        <p className="text-sm text-muted-foreground">Completadas</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default MenteeManagement;