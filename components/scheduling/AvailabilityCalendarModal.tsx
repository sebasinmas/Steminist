import React, { useState, useMemo, useEffect } from 'react';
import Button from '../common/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../common/Icons';
import { useToast } from '../../context/ToastContext';

interface AvailabilityCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvailability: Record<string, string[]>;
    onSave: (newAvailability: Record<string, string[]>) => void;
}

const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

const AvailabilityCalendarModal: React.FC<AvailabilityCalendarModalProps> = ({ isOpen, onClose, currentAvailability, onSave }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [availability, setAvailability] = useState<Record<string, string[]>>(currentAvailability);
    const { addToast } = useToast();

    useEffect(() => {
        setAvailability(currentAvailability);
    }, [currentAvailability, isOpen]);

    const { month, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        return { month, year, daysInMonth, firstDayOfMonth };
    }, [currentDate]);
    
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
        setSelectedDate(null);
    };

    const handleDateClick = (day: number) => {
        setSelectedDate(new Date(year, month, day));
    };
    
    const formatToYYYYMMDD = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const handleTimeSlotToggle = (time: string) => {
        if (!selectedDate) return;
        const dateKey = formatToYYYYMMDD(selectedDate);
        const currentTimes = availability[dateKey] || [];
        const newTimes = currentTimes.includes(time)
            ? currentTimes.filter(t => t !== time)
            : [...currentTimes, time];
        
        setAvailability(prev => ({ ...prev, [dateKey]: newTimes }));
    };

    const handleSave = () => {
        onSave(availability);
        addToast('Disponibilidad guardada correctamente.', 'success');
    };

    if (!isOpen) return null;
    
    const selectedDateKey = selectedDate ? formatToYYYYMMDD(selectedDate) : null;
    const selectedDateTimes = selectedDateKey ? availability[selectedDateKey] || [] : [];
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-lg p-6 m-4 max-w-4xl w-full relative transform transition-all flex flex-col md:flex-row gap-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                
                {/* Calendar View */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-accent"><ChevronLeftIcon /></button>
                        <h2 className="text-xl font-bold">{new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate)}</h2>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-accent"><ChevronRightIcon /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mt-2">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, day) => {
                            const dayNumber = day + 1;
                            const date = new Date(year, month, dayNumber);
                            const dateKey = formatToYYYYMMDD(date);
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            const hasAvailability = availability[dateKey] && availability[dateKey].length > 0;
                            
                            return (
                                <button
                                    key={dayNumber}
                                    onClick={() => handleDateClick(dayNumber)}
                                    className={`p-2 rounded-lg aspect-square text-center transition-colors ${
                                        isSelected ? 'bg-primary text-primary-foreground' : 
                                        'hover:bg-accent'
                                    }`}
                                >
                                    <span className={`relative ${hasAvailability && !isSelected ? 'font-bold' : ''}`}>
                                        {dayNumber}
                                        {hasAvailability && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"></span>}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Slot View */}
                <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6">
                     <h3 className="text-lg font-semibold mb-4">
                        {selectedDate ? `Horas disponibles para ${selectedDate.toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}` : 'Selecciona una fecha'}
                     </h3>
                     {selectedDate ? (
                        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2">
                            {timeSlots.map(time => (
                                <Button
                                    key={time}
                                    variant={selectedDateTimes.includes(time) ? 'primary' : 'secondary'}
                                    onClick={() => handleTimeSlotToggle(time)}
                                >
                                    {time}
                                </Button>
                            ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground">Haz clic en una fecha del calendario para establecer tus horas disponibles.</p>
                     )}
                     <div className="mt-6 flex justify-end gap-2">
                         <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                         <Button onClick={handleSave}>Guardar Disponibilidad</Button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityCalendarModal;